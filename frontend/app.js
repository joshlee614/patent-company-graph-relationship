let network = null;
let edgesData = [];
let topCompaniesData = []; // Store it to use score when clicking

const COLORS = {
    univFill: '#EEEDFE', univStroke: '#534AB7',
    d1Fill: '#E1F5EE', d1Stroke: '#0F6E56',
    d2Fill: '#FAECE7', d2Stroke: '#993C1D',
    none: '#94a3b8',
    contact: '#1D9E75', 
    progress: '#534AB7', 
    done: '#888780'
};

const CATEGORY_COLORS = {
    'A': '#3b82f6', 'B': '#ec4899', 'C': '#10b981', 'D': '#f59e0b',
    'E': '#8b5cf6', 'F': '#06b6d4', 'G': '#64748b', 'H': '#dc2626',
    'I': '#6366f1', 'J': '#14b8a6', 'K': '#f97316', 'L': '#d946ef', 'M': '#84cc16'
};

function getCategoryName(code) {
    const map = {
        'A': '반도체', 'B': '디스플레이', 'C': '이차전지', 'D': '차세대원자력',
        'E': '첨단바이오', 'F': '우주항공', 'G': '수소', 'H': '사이버보안',
        'I': '인공지능', 'J': '차세대통신', 'K': '첨단로봇', 'L': '양자', 'M': '모빌리티'
    };
    return map[code] || '기타/미분류';
}

// Configuration for Backend Decoupling (Phase 6 & 7)
// To connect to a real database or remote storage (like S3 or another Application), change this URL.
const CONFIG = {
    API_BASE_URL: 'data' // Integrated data branch into main
};

document.addEventListener("DOMContentLoaded", () => {
    loadRealData();
});

function loadRealData() {
    Papa.parse(`${CONFIG.API_BASE_URL}/output_demand_scores.csv`, {
        download: true,
        header: true,
        dynamicTyping: true,
        complete: function(results) {
            const validCompanies = results.data.filter(c => c.Company && c.University);
            topCompaniesData = validCompanies.slice(0, 50); 
            renderCompanyTable(topCompaniesData);
            loadEdgesData();
        }
    });
}

function loadEdgesData() {
    Papa.parse(`${CONFIG.API_BASE_URL}/output_edges.csv`, {
        download: true,
        header: true,
        dynamicTyping: true,
        complete: function(results) {
            edgesData = results.data.filter(e => e.target_company && e.source_uni);
        }
    });
}

function renderCompanyTable(companies) {
    const tableBody = document.getElementById('company-table-body');
    tableBody.innerHTML = '';
    
    companies.forEach((company) => {
        const tr = document.createElement('tr');
        const tScore = Number(company.TotalScore || 0).toFixed(1);
        const fScore = Number(company.FreqScore || 0).toFixed(1);
        const rScore = Number(company.RecencyScore || 0).toFixed(1);
        const uniPats = company.UniquePatents || 0;
        
        tr.innerHTML = `
            <td style="font-weight: 600; color: #fff;">
                ${company.Company}
                <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 400; margin-top:2px;">${company.University}</div>
            </td>
            <td><span class="score-badge">${tScore}</span></td>
            <td>${fScore}</td>
            <td>${rScore}</td>
            <td>${uniPats} 건</td>
            <td><button class="btn btn-action">대시보드 액션</button></td>
        `;
        
        tr.addEventListener('click', () => {
            Array.from(tableBody.children).forEach(el => el.classList.remove('selected'));
            tr.classList.add('selected');
            closeActionPanel();
            renderGraphForCompany(company);
        });
        tableBody.appendChild(tr);
    });
}

// ------ MOCK CRM & DART DATA LOGIC ------
const STATUS_TYPES = ['none', 'contact', 'progress', 'done'];

function getMockFinancials(companyName) {
    let hash = 0;
    for (let i = 0; i < companyName.length; i++) hash += companyName.charCodeAt(i);
    
    const revenueGen = (hash * 13) % 900 + 10; // 10억 ~ 910억
    const employeesGen = (hash * 7) % 500 + 10; // 10명 ~ 510명
    
    const firstNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권'];
    const lastNames1 = ['민', '영', '지', '성', '준', '현', '우', '정', '진', '수', '태', '동', '재', '석'];
    const lastNames2 = ['수', '호', '훈', '환', '희', '건', '영', '철', '민', '준', '아', '윤', '우', '진'];
    
    const ceo = firstNames[hash % firstNames.length] + lastNames1[(hash*2) % lastNames1.length] + lastNames2[(hash*3) % lastNames2.length];
    
    return {
        revenue: `${revenueGen}억 원`,
        employees: `${employeesGen}명`,
        ceo: `${ceo}`
    };
}

function getMockCRMData(companyName) {
    const hash = companyName.length + companyName.charCodeAt(0) + companyName.charCodeAt(companyName.length - 1);
    const status = STATUS_TYPES[hash % STATUS_TYPES.length];
    
    let history = [];
    if (status !== 'none') {
        history.push({ date: '2023.10.15', text: '최초 콜드 메일 발송 및 수요 파악', type: 'contact' });
        if (status === 'progress' || status === 'done') {
            history.unshift({ date: '2023.11.02', text: '1차 비대면 미팅 (기술이전 조건 논의)', type: 'progress' });
            history.unshift({ date: '2023.11.20', text: '기밀유지협약(NDA) 체결 완료', type: 'progress' });
        }
        if (status === 'done') {
            history.unshift({ date: '2023.12.15', text: '기술이전 라이선스 계약 논의 완료', type: 'done' });
        }
    } else {
        history.push({ date: '-', text: '접촉 이력 없음', type: 'none' });
    }
    
    return {
        status,
        history,
        reason: `${companyName}은(는) 최근 배터리 핵심 소재 관련 특허 출원 증가 추세를 보이며, 본 대학의 기초재료 특허 포트폴리오와 높은 기술적 궤적의 겹침을 보임. 수요 전환 가능성이 매우 높음.`
    };
}

function renderGraphForCompany(companyObj) {
    const universityName = companyObj.University;
    const companyName = companyObj.Company;
    
    document.getElementById('graph-overlay').classList.add('hidden');
    document.getElementById('graph-title').innerText = `인용 네트워크: ${universityName} ➔ ${companyName}`;
    
    if (!edgesData || edgesData.length === 0) {
        alert('데이터 로딩 중입니다. 잠시만 기다려주세요.');
        return;
    }
    
    const relevantEdges = edgesData.filter(e => {
        const uniStr = String(e.source_uni);
        const compStr = String(e.target_company);
        return (universityName.includes(uniStr) || uniStr.includes(universityName)) && 
               (companyName.includes(compStr) || compStr.includes(companyName));
    });
    
    if (relevantEdges.length === 0) {
        alert(`해당 기업(${companyName})과 대학(${universityName})을 매칭할 인용 데이터가 없습니다.`);
        return;
    }
    
    // Group edges to calculate citation counts
    const groupedEdges = {};
    relevantEdges.forEach(e => {
        const key = `${e.source_patent}-${e.target_patent}`;
        if (!groupedEdges[key]) {
            groupedEdges[key] = { ...e, citationCount: 1 };
        } else {
            groupedEdges[key].citationCount += 1;
        }
    });

    const nodes = new vis.DataSet();
    const edges = new vis.DataSet();
    const addedNodes = new Map(); // id -> nodeData object mapping
    
    Object.values(groupedEdges).forEach(edge => {
        const sourceId = String(edge.source_patent);
        const targetId = String(edge.target_patent);
        
        // SOURCE NODE (Univ)
        if (!addedNodes.has(sourceId)) {
            const nodeData = {
                id: sourceId,
                label: sourceId.substring(0, 10),
                color: { background: COLORS.univFill, border: COLORS.univStroke },
                borderWidth: 2,
                font: { color: '#ffffff' },
                shape: 'dot',
                size: 16,
                isUniv: true,
                title: `대학 원천특허\nPatent: ${sourceId}`
            };
            nodes.add(nodeData);
            addedNodes.set(sourceId, nodeData);
        }
        
        // TARGET NODE (Company)
        if (!addedNodes.has(targetId)) {
            const isDepth2 = (targetId.charCodeAt(targetId.length-1) % 3 === 0);
            const targetColor = isDepth2 ? COLORS.d2Fill : COLORS.d1Fill;
            const targetStroke = isDepth2 ? COLORS.d2Stroke : COLORS.d1Stroke;
            const targetSize = isDepth2 ? 10 : 14; 
            
            // Generate mock data for Dashboard interaction
            const mockData = getMockCRMData(companyName);
            let finalBorderColor = targetStroke;
            let finalBorderWidth = 1;
            
            // Apply Strategy Tech Colors based on target Category!
            const tCat = String(edge.target_category || '').trim();
            const hexColor = CATEGORY_COLORS[tCat] || targetColor;
            
            // Apply Status Dot styling (Using border/shadow thickness as visual indicator)
            if (mockData.status !== 'none') {
                finalBorderColor = COLORS[mockData.status];
                finalBorderWidth = 4;
            }
            
            // Risk Level Labeling
            const extraLabel = (edge.target_risk === 'HIGH') ? '\n⚠️ 위험도(HIGH)' : '';

            const nodeData = {
                id: targetId,
                label: targetId.substring(0, 10) + extraLabel,
                color: { background: hexColor, border: finalBorderColor },
                borderWidth: finalBorderWidth,
                font: { color: '#ffffff' },
                shape: 'dot',
                size: targetSize,
                isUniv: false,
                companyName: companyName,
                companyScoreObj: companyObj,
                citationCount: edge.citationCount,
                mockData: mockData,
                title: `[${mockData.status.toUpperCase()}] 기업 특허${isDepth2 ? ' (간접)' : ' (직접)'}\nPatent: ${targetId}`
            };
            
            nodes.add(nodeData);
            addedNodes.set(targetId, nodeData);
        }
        
        // EDGE
        const isDepth2 = (targetId.charCodeAt(targetId.length-1) % 3 === 0);
        edges.add({
            from: sourceId,
            to: targetId,
            color: { color: edge.citationCount >= 2 ? COLORS.contact : 'rgba(255,255,255,0.2)', highlight: '#ffffff' },
            arrows: 'to',
            width: edge.citationCount >= 2 ? 2.5 : 1,
            length: 150,
            dashes: isDepth2 ? [3, 2] : false, // Dash for Indirect Citations
            title: `인용 건수: ${edge.citationCount}`
        });
    });
    
    const container = document.getElementById('network-canvas');
    const data = { nodes, edges };
    const options = {
        physics: {
            forceAtlas2Based: { gravitationalConstant: -50, centralGravity: 0.01, springLength: 100, springConstant: 0.08 },
            maxVelocity: 50, solver: 'forceAtlas2Based', timestep: 0.35, stabilization: { iterations: 150 }
        },
        interaction: { hover: true, tooltipDelay: 200, zoomView: true }
    };
    
    if (network) {
        network.destroy();
    }
    
    try {
        network = new vis.Network(container, data, options);
        
        // Bind Click Event
        network.on("click", function(params) {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                const nodeData = addedNodes.get(nodeId);
                const connectedEdges = network.getConnectedEdges(nodeId).map(eId => edges.get(eId));
                
                openActionPanel(nodeId, nodeData, connectedEdges);
            } else {
                closeActionPanel();
            }
        });
        
    } catch (err) {
        alert("그래프 렌더링 에러: " + err.message);
    }
}

// ------ ACTION PANEL LOGIC ------

function openActionPanel(nodeId, nodeData, connectedEdges) {
    if (nodeData.isUniv) return; // Skip for university origin nodes
    
    const panel = document.getElementById('action-panel');
    const mock = nodeData.mockData;
    
    // Header
    document.getElementById('panel-company-name').innerText = nodeData.companyName;
    const chip = document.getElementById('panel-status-chip');
    chip.className = `status-chip ${mock.status}`;
    chip.innerText = getStatusLabel(mock.status);
    
    // Score Breakdown
    const compObj = nodeData.companyScoreObj;
    document.getElementById('panel-score-total').innerText = compObj.TotalScore ? Number(compObj.TotalScore).toFixed(1) : '85.4';
    document.getElementById('panel-score-freq').innerText = nodeData.citationCount;
    document.getElementById('panel-score-div').innerText = compObj.UniquePatents || 2;
    
    // Citation chain mapping
    const chainHtml = connectedEdges.map(e => `<div style="margin-bottom:4px;">${e.from.substring(0,8)}... → <b>${e.to.substring(0,8)}...</b> (건수: ${e.width === 2.5 ? '2+' : 1})</div>`).join('');
    document.getElementById('panel-citation-chain').innerHTML = chainHtml;
    
    // Demand Reason bindings from tblTechAllNew metadata
    const catStr = getCategoryName(compObj.CategoryCode);
    const riskBadge = compObj.RiskLevel === 'HIGH' ? '<span style="color:red; font-weight:bold;"> [심판/분쟁 위험도: HIGH]</span>' : '';
    document.getElementById('panel-demand-reason').innerHTML = `
        <strong style="color:#e2e8f0;">타겟 분야:</strong> ${catStr}${riskBadge}<br>
        <strong style="color:#e2e8f0; margin-top:8px; display:inline-block;">핵심 보유 기술:</strong> ${compObj.BestPatentTitle || 'N/A'}<br>
        <div style="margin-top:6px; color:#94a3b8; font-size:13px; line-height:1.5;">${compObj.BestPatentSummary ? compObj.BestPatentSummary.substring(0,250)+'...' : '요약 정보 없음'}</div>
    `;
    
    // DART Simulated Financials
    const fins = getMockFinancials(companyObj.id);
    document.getElementById('panel-financials').innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span style="color:#94a3b8;">대표이사:</span> <strong>${fins.ceo}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span style="color:#94a3b8;">최근 연매출:</span> <strong style="color:#10b981;">${fins.revenue}</strong>
        </div>
        <div style="display:flex; justify-content:space-between;">
            <span style="color:#94a3b8;">임직원 수:</span> <strong>${fins.employees}</strong>
        </div>
    `;
    
    // Contact History
    const historyHtml = mock.history.map(h => `
        <div class="history-item">
            <div class="history-dot" style="border: 2px solid ${COLORS[h.type]}"></div>
            <span class="history-date">${h.date}</span>
            <span class="history-text">${h.text}</span>
        </div>
    `).join('');
    document.getElementById('panel-contact-history').innerHTML = historyHtml;
    
    // Generate Buttons
    const btnContainer = document.getElementById('panel-action-buttons');
    btnContainer.innerHTML = getButtonsForStatus(mock.status, nodeData);

    panel.classList.add('open');
}

function closeActionPanel() {
    document.getElementById('action-panel').classList.remove('open');
}

function getStatusLabel(status) {
    const map = { 'none': '미접촉', 'contact': '접촉 완료', 'progress': '협상 진행 중', 'done': '계약 완료' };
    return map[status] || '미접촉';
}

function getButtonsForStatus(status, nodeData) {
    const compObj = nodeData.companyScoreObj;
    const catName = getCategoryName(compObj.CategoryCode);
    // Encode the complex data safely
    const dataObj = { 
        name: nodeData.companyName, 
        pat: nodeData.id, 
        score: compObj.TotalScore,
        techTitle: compObj.BestPatentTitle,
        category: catName,
        summary: compObj.BestPatentSummary
    };
    
    const dataStr = encodeURIComponent(JSON.stringify(dataObj).replace(/'/g, "%27"));

    if (status === 'none') {
        return `
            <button class="action-btn primary" onclick="generatePrompt('emailDraft', '${dataStr}')">초정밀 제안 메일 초안 ↗</button>
            <button class="action-btn secondary" onclick="generatePrompt('analysis', '${dataStr}')">기술 연관성 분석 보고서 ↗</button>
            <button class="action-btn neutral" onclick="generatePrompt('agenda', '${dataStr}')">미팅 아젠다 초안 ↗</button>
        `;
    } else if (status === 'contact') {
        return `
            <button class="action-btn primary" onclick="generatePrompt('followUp', '${dataStr}')">후속 협상 이메일 작성 ↗</button>
            <button class="action-btn secondary" onclick="generatePrompt('valuation', '${dataStr}')">라이선스 가치 추정 ↗</button>
            <button class="action-btn neutral" onclick="generatePrompt('techList', '${dataStr}')">추가 기술 제안서 ↗</button>
        `;
    } else {
        return `
            <button class="action-btn primary" onclick="generatePrompt('checklist', '${dataStr}')">계약 체크리스트 ↗</button>
            <button class="action-btn secondary" onclick="generatePrompt('dueDiligence', '${dataStr}')">기술 실사 대응 자료 ↗</button>
            <button class="action-btn neutral" onclick="generatePrompt('strategy', '${dataStr}')">협상 전략 요약 ↗</button>
        `;
    }
}

function generatePrompt(type, dataStr) {
    const data = JSON.parse(decodeURIComponent(dataStr).replace(/%27/g, "'"));
    const techSumFragment = data.summary ? data.summary.substring(0, 100) : '';
    
    const templates = {
        emailDraft: `[기업명: ${data.name}]에 보내는 '${data.category}' 분야 기술이전 콜드메일을 작성해줘.
수요점수: ${Number(data.score).toFixed(1)}점
사측 핵심특허: [${data.techTitle}] (${data.pat})
사측 특허 요약: ${techSumFragment}...
대학 측 기술과 위 사측 특허 요약본의 높은 시너지를 강조하며 미팅을 제안하는 3단락 메일 완성.`,
        analysis: `${data.name}의 포트폴리오(${data.techTitle})와 대학 기술의 기술적 교집합(Cross-over)을 분석해줘.`,
        agenda: `${data.name}과의 첫 미팅 아젠다를 기획해줘.`,
        followUp: `${data.name}과 기술 소개 미팅 이후 후속 협상 이메일을 작성해줘.`,
        valuation: `${data.name}이 인용한 특허(${data.pat})에 기반한 라이선스 가치 추정 로직을 작성해줘.`,
        techList: `${data.name}에게 추가로 제안할만한 유관 특허 리스트업 기준을 작성해줘.`,
        checklist: `${data.name}과의 기술이전 계약 체결을 위한 체크리스트를 만들어줘.`,
        dueDiligence: `${data.name}의 기술 실사(Due Diligence) 요청에 대비한 방어 전략서 목차를 작성해줘.`,
        strategy: `${data.name}과의 협상에서 우위를 점하기 위한 전략적 협상 포인트를 요약해줘.`
    };
    alert(`[AI Prompt Generated]\n========================\n\n${templates[type]}`);
}
