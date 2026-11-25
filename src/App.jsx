import React, { useState, useEffect } from 'react';

// ==========================================
// DEFAULT DATA
// ==========================================
const defaultRoles = [
  { id: 1, name: 'CS', isBOH: false },
  { id: 2, name: 'Cashier', isBOH: false },
  { id: 3, name: 'Host', isBOH: false },
  { id: 4, name: 'Cleaning', isBOH: false },
  { id: 5, name: 'Front Grill', isBOH: true },
  { id: 6, name: 'Back Grill', isBOH: true },
  { id: 7, name: 'Co Ord', isBOH: false },
  { id: 8, name: 'Kitchen', isBOH: true },
  { id: 9, name: 'Manager', isBOH: false },
];

const defaultEmployees = [
  { id: 1, name: 'Naomi', role: 'CS', under18: false },
  { id: 2, name: 'Denise', role: 'Cashier', under18: false },
  { id: 3, name: 'Mark', role: 'Host', under18: true },
  { id: 4, name: 'Justyna', role: 'Cleaning', under18: false },
  { id: 5, name: 'Matvii', role: 'Front Grill', under18: false },
  { id: 6, name: 'Parve', role: 'Back Grill', under18: false },
  { id: 7, name: 'Jordan', role: 'Back Grill', under18: false },
  { id: 8, name: 'Tishe', role: 'Co Ord', under18: false },
  { id: 9, name: 'Falou', role: 'Host', under18: false },
  { id: 10, name: 'Gustavo', role: 'Cashier', under18: false },
  { id: 11, name: 'Guershom', role: 'Front Grill', under18: false },
  { id: 12, name: 'Jose', role: 'Back Grill', under18: false },
  { id: 13, name: 'Jaw San', role: 'Co Ord', under18: false },
  { id: 14, name: 'Aaliyah', role: 'Co Ord', under18: false },
  { id: 15, name: 'Dmytrii', role: 'Kitchen', under18: false },
  { id: 16, name: 'Alina', role: 'Manager', under18: false },
  { id: 17, name: 'David', role: 'Manager', under18: false },
  { id: 18, name: 'Marta', role: 'Manager', under18: false },
];

const defaultBreakRules = [
  { id: 1, minHours: 0, maxHours: 3.99, breakText: '0' },
  { id: 2, minHours: 4, maxHours: 5.99, breakText: '20' },
  { id: 3, minHours: 6, maxHours: 9.99, breakText: '30' },
  { id: 4, minHours: 10, maxHours: 11.99, breakText: '15 + 30' },
  { id: 5, minHours: 12, maxHours: 24, breakText: '30 + 30' },
];

const defaultTasks = [
  'Enough stock in drawers',
  'Enough change in tills & safe count complete',
  'Communicate Out of date/stock products',
  'Enough defrosted for the PM shift',
  'Both ovens & dishwasher half-cleaned',
  'All items from delivery put away',
  'GRV & Meat Traceability done',
  'All breaks closed off',
  'Rotageek hours approved & adjusted. Log sickness'
];

const defaultClosedownJobs = [
  'Defrosting',
  'Mop Outside',
  'Nuts/Olives & Till Area',
  'Sauces',
  'Coke & Ice Machine',
  'Pull Chicken',
  'Nandoca Room',
  'Cardboard/Glass Bin',
  'Stock Fridges'
];

const initialSheetState = {
  location: 'Mahon Point',
  date: new Date().toISOString().split('T')[0],
  forecastToday: '',
  forecastTomorrow: '',
  amManagerId1: '', amManagerId2: '',
  splitManagerId1: '', splitManagerId2: '',
  pmManagerId1: '', pmManagerId2: '',
  amShifts: [],
  pmShifts: [],
  happyCount: 0,
  neutralCount: 0,
  sadCount: 0,
  npsScore: '',
  foodScore: ''
};

// Soma minutos de textos como "15 + 30" ou "30 + 30" para validar regra U18
const parseBreakTotalMins = (text) => {
  if (!text) return 0;
  return text
    .toString()
    .split('+')
    .reduce((sum, part) => sum + (parseInt(part.trim(), 10) || 0), 0);
};

// Insere novo turno na ordem de horário dentro do seu grupo (FOH ou BOH)
// sem desmanchar eventuais reordenações manuais já feitas
const insertShiftOrdered = (currentShifts, newShift) => {
  const group = currentShifts.filter(s => s.isBOH === newShift.isBOH);
  const otherGroup = currentShifts.filter(s => s.isBOH !== newShift.isBOH);

  const newTime = parseFloat(newShift.start.replace(':', '.'));
  let insertIdx = group.findIndex(s => parseFloat(s.start.replace(':', '.')) > newTime);
  if (insertIdx === -1) insertIdx = group.length;

  const updatedGroup = [
    ...group.slice(0, insertIdx),
    newShift,
    ...group.slice(insertIdx)
  ];

  return newShift.isBOH
    ? [...otherGroup, ...updatedGroup]
    : [...updatedGroup, ...otherGroup];
};

// ==========================================
// MAIN APP COMPONENT
// ==========================================
export default function App() {
  const [activeTab, setActiveTab] = useState('sheet');

  const [roles, setRoles] = useState(() => JSON.parse(localStorage.getItem('roles')) || defaultRoles);
  const [employees, setEmployees] = useState(() => JSON.parse(localStorage.getItem('employees')) || defaultEmployees);
  const [breakRules, setBreakRules] = useState(() => JSON.parse(localStorage.getItem('breakRules_v2')) || defaultBreakRules);
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem('tasks')) || defaultTasks);
  const [closedownJobs, setClosedownJobs] = useState(() => JSON.parse(localStorage.getItem('closedownJobs')) || defaultClosedownJobs);

  useEffect(() => localStorage.setItem('roles', JSON.stringify(roles)), [roles]);
  useEffect(() => localStorage.setItem('employees', JSON.stringify(employees)), [employees]);
  useEffect(() => localStorage.setItem('breakRules_v2', JSON.stringify(breakRules)), [breakRules]);
  useEffect(() => localStorage.setItem('tasks', JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem('closedownJobs', JSON.stringify(closedownJobs)), [closedownJobs]);

  const [sheetData, setSheetData] = useState(initialSheetState);

  const clearForm = () => {
    if (window.confirm("Tem certeza que deseja apagar os turnos e limpar este formulário?")) {
      setSheetData({
        ...initialSheetState,
        date: new Date().toISOString().split('T')[0],
      });
    }
  };

  const calculateBreak = (empId, startH, startM, endH, endM) => {
    const emp = employees.find(e => e.id.toString() === empId.toString());
    if (!emp) return '0';

    const sH = parseInt(startH, 10), sM = parseInt(startM, 10);
    const eH = parseInt(endH, 10), eM = parseInt(endM, 10);

    let duration = (eH + eM / 60) - (sH + sM / 60);
    if (duration < 0) duration += 24;

    let breakText = '0';
    const applicableRule = breakRules.find(r => duration >= r.minHours && duration <= r.maxHours);
    if (applicableRule) {
      breakText = applicableRule.breakText;
    }

    if (emp.under18 && parseBreakTotalMins(breakText) < 30) {
      breakText = '30';
    }

    return breakText;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans print:bg-white print:m-0 print:p-0">
      <style>{`
        input, select, textarea {
          background-color: #ffffff;
          color: #111827;
        }
        @media print {
          @page { size: A4 landscape; margin: 4mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .noprint { display: none !important; }
          .print-only { display: block !important; }
          .a4-container { width: 289mm; height: 196mm; margin: 0 auto; background: white; overflow: hidden; page-break-after: avoid; }
        }
        @media screen {
          .print-only { display: none !important; }
          .a4-container { max-width: 1200px; margin: 20px auto; background: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        }
      `}</style>

      <nav className="bg-slate-800 text-white p-4 shadow-md noprint">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-xl">📋</span>
            <span className="text-xl font-bold tracking-tight">ShiftMaster Pro</span>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('sheet')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'sheet' ? 'bg-orange-500' : 'hover:bg-slate-700'}`}
            >
              <span>📄 Daily Sheet</span>
            </button>
            <button
              onClick={() => setActiveTab('management')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'management' ? 'bg-orange-500' : 'hover:bg-slate-700'}`}
            >
              <span>⚙️ Management</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="pb-12 print:pb-0">
        {activeTab === 'management' && (
          <ManagementTab
            roles={roles} setRoles={setRoles}
            employees={employees} setEmployees={setEmployees}
            breakRules={breakRules} setBreakRules={setBreakRules}
            tasks={tasks} setTasks={setTasks}
            closedownJobs={closedownJobs} setClosedownJobs={setClosedownJobs}
          />
        )}

        {activeTab === 'sheet' && (
          <div>
            <div className="max-w-7xl mx-auto mt-6 p-6 bg-white rounded-xl shadow-sm border border-gray-200 noprint">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Generate Daily Sheet</h2>
                <div className="space-x-4 flex">
                  <button
                    onClick={clearForm}
                    className="flex items-center space-x-2 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg transition-colors font-medium border border-red-200"
                  >
                    <span>🗑️ Clear Sheet</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg shadow-sm transition-colors font-medium"
                  >
                    <span>🖨️ Print Sheet (A4)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                {/* COL 1: Basic Info & Metrics */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 border-b pb-2">Basic Info</h3>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Date</label>
                    <input type="date" className="w-full p-2 border rounded-md"
                      value={sheetData.date} onChange={e => setSheetData({ ...sheetData, date: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Today Forecast (€)</label>
                      <input type="number" className="w-full p-2 border rounded-md"
                        value={sheetData.forecastToday} onChange={e => setSheetData({ ...sheetData, forecastToday: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Tomorrow Forecast (€)</label>
                      <input type="number" className="w-full p-2 border rounded-md"
                        value={sheetData.forecastTomorrow} onChange={e => setSheetData({ ...sheetData, forecastTomorrow: e.target.value })} />
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-700 border-b pb-2 mt-4 pt-4">Last Week Metrics</h3>

                  <div className="flex justify-between items-center bg-gray-50 p-2 rounded border">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">😊</span>
                      <button onClick={() => setSheetData({ ...sheetData, happyCount: Math.max(0, sheetData.happyCount - 1) })} className="bg-gray-200 px-2 rounded hover:bg-gray-300">-</button>
                      <span className="w-5 text-center font-medium">{sheetData.happyCount}</span>
                      <button onClick={() => setSheetData({ ...sheetData, happyCount: sheetData.happyCount + 1 })} className="bg-gray-200 px-2 rounded hover:bg-gray-300">+</button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">😕</span>
                      <button onClick={() => setSheetData({ ...sheetData, neutralCount: Math.max(0, sheetData.neutralCount - 1) })} className="bg-gray-200 px-2 rounded hover:bg-gray-300">-</button>
                      <span className="w-5 text-center font-medium">{sheetData.neutralCount}</span>
                      <button onClick={() => setSheetData({ ...sheetData, neutralCount: sheetData.neutralCount + 1 })} className="bg-gray-200 px-2 rounded hover:bg-gray-300">+</button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">😞</span>
                      <button onClick={() => setSheetData({ ...sheetData, sadCount: Math.max(0, sheetData.sadCount - 1) })} className="bg-gray-200 px-2 rounded hover:bg-gray-300">-</button>
                      <span className="w-5 text-center font-medium">{sheetData.sadCount}</span>
                      <button onClick={() => setSheetData({ ...sheetData, sadCount: sheetData.sadCount + 1 })} className="bg-gray-200 px-2 rounded hover:bg-gray-300">+</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">NPS (0-100)</label>
                      <input type="number" min="0" max="100" className="w-full p-2 border rounded-md"
                        value={sheetData.npsScore}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          setSheetData({ ...sheetData, npsScore: val === '' ? '' : Math.min(100, parseInt(val, 10)).toString() });
                        }} />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">FOOD (0-100)</label>
                      <input type="number" min="0" max="100" className="w-full p-2 border rounded-md"
                        value={sheetData.foodScore}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          setSheetData({ ...sheetData, foodScore: val === '' ? '' : Math.min(100, parseInt(val, 10)).toString() });
                        }} />
                    </div>
                  </div>
                </div>

                {/* COL 2: Managers */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 border-b pb-2">Managers (Select up to 2)</h3>

                  <div className="bg-gray-50 p-3 rounded border">
                    <label className="block text-sm font-medium text-gray-700 mb-2">AM Manager(s)</label>
                    <div className="space-y-2">
                      <select className="w-full p-2 border rounded-md bg-white text-sm" value={sheetData.amManagerId1} onChange={e => setSheetData({ ...sheetData, amManagerId1: e.target.value })}>
                        <option value="">Manager 1...</option>
                        {employees.filter(e => e.role.toLowerCase().includes('manager')).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                      <select className="w-full p-2 border rounded-md bg-white text-sm" value={sheetData.amManagerId2} onChange={e => setSheetData({ ...sheetData, amManagerId2: e.target.value })}>
                        <option value="">Manager 2 (Optional)...</option>
                        {employees.filter(e => e.role.toLowerCase().includes('manager')).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded border">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Split Manager(s)</label>
                    <div className="space-y-2">
                      <select className="w-full p-2 border rounded-md bg-white text-sm" value={sheetData.splitManagerId1} onChange={e => setSheetData({ ...sheetData, splitManagerId1: e.target.value })}>
                        <option value="">Manager 1...</option>
                        {employees.filter(e => e.role.toLowerCase().includes('manager')).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                      <select className="w-full p-2 border rounded-md bg-white text-sm" value={sheetData.splitManagerId2} onChange={e => setSheetData({ ...sheetData, splitManagerId2: e.target.value })}>
                        <option value="">Manager 2 (Optional)...</option>
                        {employees.filter(e => e.role.toLowerCase().includes('manager')).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded border">
                    <label className="block text-sm font-medium text-gray-700 mb-2">PM Manager(s)</label>
                    <div className="space-y-2">
                      <select className="w-full p-2 border rounded-md bg-white text-sm" value={sheetData.pmManagerId1} onChange={e => setSheetData({ ...sheetData, pmManagerId1: e.target.value })}>
                        <option value="">Manager 1...</option>
                        {employees.filter(e => e.role.toLowerCase().includes('manager')).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                      <select className="w-full p-2 border rounded-md bg-white text-sm" value={sheetData.pmManagerId2} onChange={e => setSheetData({ ...sheetData, pmManagerId2: e.target.value })}>
                        <option value="">Manager 2 (Optional)...</option>
                        {employees.filter(e => e.role.toLowerCase().includes('manager')).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* COL 3: Add Shift */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 border-b pb-2">Add Shift</h3>
                  <ShiftAdder
                    employees={employees}
                    roles={roles}
                    calculateBreak={calculateBreak}
                    onAdd={(shift, type) => {
                      if (type === 'AM') {
                        setSheetData(prev => ({ ...prev, amShifts: insertShiftOrdered(prev.amShifts, shift) }));
                      } else {
                        setSheetData(prev => ({ ...prev, pmShifts: insertShiftOrdered(prev.pmShifts, shift) }));
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500">
                    💡 Dica: Na folha abaixo, clique e arraste o nome de qualquer funcionário para mudar a ordem (FOH só move entre FOH e BOH só move entre BOH).
                  </p>
                </div>
              </div>
            </div>

            <div className="a4-container p-4 print:p-1 flex flex-col text-black font-sans text-xs mt-8 print:mt-0">
              <SheetPreview
                data={sheetData}
                employees={employees}
                tasks={tasks}
                closedownJobs={closedownJobs}
                setData={setSheetData}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ==========================================
// SHIFT ADDER
// ==========================================
function ShiftAdder({ employees, roles, calculateBreak, onAdd }) {
  const [empId, setEmpId] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const [startH, setStartH] = useState('09');
  const [startM, setStartM] = useState('00');
  const [endH, setEndH] = useState('17');
  const [endM, setEndM] = useState('00');

  const [type, setType] = useState('AM');

  const hoursOptions = Array.from({ length: 24 }).map((_, i) => i.toString().padStart(2, '0'));
  const minsOptions = ['00', '15', '30', '45'];

  useEffect(() => {
    if (empId) {
      const emp = employees.find(e => e.id.toString() === empId.toString());
      if (emp) setSelectedRole(emp.role);
    } else {
      setSelectedRole('');
    }
  }, [empId, employees]);

  const handleAdd = () => {
    if (!empId || !selectedRole) return;
    const emp = employees.find(e => e.id.toString() === empId.toString());
    const roleObj = roles.find(r => r.name === selectedRole);
    const breakText = calculateBreak(empId, startH, startM, endH, endM);

    onAdd({
      id: Date.now() + Math.random(),
      empId,
      name: emp.name,
      role: selectedRole,
      isBOH: roleObj ? roleObj.isBOH : false,
      start: `${startH}:${startM}`,
      timeStr: `${startH}:${startM}-${endH}:${endM}`,
      breakText
    }, type);

    setEmpId('');
    setSelectedRole('');
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="space-y-3 mb-3">
        <select className="w-full p-2 border rounded text-sm bg-white" value={empId} onChange={e => setEmpId(e.target.value)}>
          <option value="">1. Select Employee...</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name} {e.under18 ? '(U18)' : ''}</option>)}
        </select>

        <select className="w-full p-2 border rounded text-sm bg-white" value={selectedRole} onChange={e => setSelectedRole(e.target.value)} disabled={!empId}>
          <option value="">2. Position for this shift...</option>
          {roles.map(r => <option key={r.id} value={r.name}>{r.name} {r.isBOH ? '(BOH)' : ''}</option>)}
        </select>

        <div className="flex items-center space-x-2 text-sm">
          <span className="font-semibold text-gray-600 w-10">In:</span>
          <select className="p-1 border rounded bg-white" value={startH} onChange={e => setStartH(e.target.value)}>{hoursOptions.map(h => <option key={h}>{h}</option>)}</select>
          <span>:</span>
          <select className="p-1 border rounded bg-white" value={startM} onChange={e => setStartM(e.target.value)}>{minsOptions.map(m => <option key={m}>{m}</option>)}</select>
        </div>

        <div className="flex items-center space-x-2 text-sm">
          <span className="font-semibold text-gray-600 w-10">Out:</span>
          <select className="p-1 border rounded bg-white" value={endH} onChange={e => setEndH(e.target.value)}>{hoursOptions.map(h => <option key={h}>{h}</option>)}</select>
          <span>:</span>
          <select className="p-1 border rounded bg-white" value={endM} onChange={e => setEndM(e.target.value)}>{minsOptions.map(m => <option key={m}>{m}</option>)}</select>
        </div>
      </div>

      <div className="flex space-x-2 pt-2 border-t">
        <select className="p-2 border rounded text-sm flex-1 bg-white" value={type} onChange={e => setType(e.target.value)}>
          <option value="AM">AM Shift</option>
          <option value="PM">PM Shift</option>
        </select>
        <button onClick={handleAdd} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded flex-1 flex justify-center items-center font-bold">
          ➕ Add
        </button>
      </div>
    </div>
  );
}

// ==========================================
// MANAGEMENT TAB
// ==========================================
function ManagementTab({ roles, setRoles, employees, setEmployees, breakRules, setBreakRules, tasks, setTasks, closedownJobs, setClosedownJobs }) {
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleBOH, setNewRoleBOH] = useState(false);

  const [editEmpId, setEditEmpId] = useState(null);
  const [editEmpForm, setEditEmpForm] = useState({});
  const [editRuleId, setEditRuleId] = useState(null);
  const [editRuleForm, setEditRuleForm] = useState({});

  const addRole = (e) => {
    e.preventDefault();
    if (newRoleName.trim()) {
      setRoles([...roles, { id: Date.now(), name: newRoleName.trim(), isBOH: newRoleBOH }]);
      setNewRoleName('');
      setNewRoleBOH(false);
    }
  };
  const deleteRole = (id) => setRoles(roles.filter(r => r.id !== id));

  const addEmployee = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newEmp = {
      id: Date.now(),
      name: formData.get('name'),
      role: formData.get('role'),
      under18: formData.get('under18') === 'on'
    };
    if (newEmp.name && newEmp.role) {
      setEmployees([...employees, newEmp]);
      e.target.reset();
    }
  };
  const deleteEmployee = (id) => setEmployees(employees.filter(e => e.id !== id));
  const saveEditEmployee = () => {
    setEmployees(employees.map(e => e.id === editEmpId ? editEmpForm : e));
    setEditEmpId(null);
  };

  const saveEditRule = () => {
    setBreakRules(breakRules.map(r => r.id === editRuleId ? {
      ...editRuleForm,
      minHours: parseFloat(editRuleForm.minHours),
      maxHours: parseFloat(editRuleForm.maxHours),
      breakText: editRuleForm.breakText.toString().trim() || '0'
    } : r));
    setEditRuleId(null);
  };

  const addListItem = (e, list, setList) => {
    e.preventDefault();
    const item = new FormData(e.target).get('item');
    if (item) {
      setList([...list, item]);
      e.target.reset();
    }
  };
  const deleteListItem = (idx, list, setList) => {
    const newList = [...list];
    newList.splice(idx, 1);
    setList(newList);
  };

  return (
    <div className="max-w-7xl mx-auto mt-6 px-4 noprint">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Roles */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden col-span-1 lg:col-span-1">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center">
            <span className="mr-2">🏷️</span>
            <h3 className="font-bold text-gray-800">Job Positions (Roles)</h3>
          </div>
          <div className="p-6">
            <form onSubmit={addRole} className="flex gap-2 mb-4 flex-wrap">
              <input value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="New Position..." className="flex-1 p-2 border rounded text-sm min-w-[120px]" required />
              <label className="flex items-center space-x-2 bg-gray-50 px-2 border rounded cursor-pointer">
                <input type="checkbox" checked={newRoleBOH} onChange={e => setNewRoleBOH(e.target.checked)} className="h-4 w-4" />
                <span className="text-xs font-bold text-red-600">is BOH?</span>
              </label>
              <button type="submit" className="bg-indigo-600 text-white px-3 rounded hover:bg-indigo-700">+</button>
            </form>
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {roles.map((r) => (
                <li key={r.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 border rounded group">
                  <span className="truncate flex-1 pr-2">{r.name} {r.isBOH && <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">BOH</span>}</span>
                  <div className="space-x-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => deleteRole(r.id)} className="text-red-400 hover:text-red-600">🗑️</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden col-span-1 lg:col-span-2">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center">
            <span className="mr-2">👥</span>
            <h3 className="font-bold text-gray-800">Team Members</h3>
          </div>
          <div className="p-6">
            <form onSubmit={addEmployee} className="flex gap-4 mb-6">
              <input name="name" placeholder="Name" className="flex-1 p-2 border rounded" required />
              <select name="role" className="flex-1 p-2 border rounded bg-white" required>
                <option value="">Default Position...</option>
                {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
              <label className="flex items-center space-x-2 bg-gray-50 px-3 border rounded cursor-pointer">
                <input name="under18" type="checkbox" className="h-4 w-4" />
                <span className="text-sm font-medium">Under 18</span>
              </label>
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Add</button>
            </form>

            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-3 font-semibold">Name</th>
                    <th className="p-3 font-semibold">Default Role</th>
                    <th className="p-3 font-semibold text-center">Under 18</th>
                    <th className="p-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {employees.map(emp => (
                    editEmpId === emp.id ? (
                      <tr key={emp.id} className="bg-indigo-50">
                        <td className="p-2"><input className="w-full p-1 border rounded" value={editEmpForm.name} onChange={e => setEditEmpForm({ ...editEmpForm, name: e.target.value })} /></td>
                        <td className="p-2">
                          <select className="w-full p-1 border rounded bg-white" value={editEmpForm.role} onChange={e => setEditEmpForm({ ...editEmpForm, role: e.target.value })}>
                            {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                          </select>
                        </td>
                        <td className="p-2 text-center"><input type="checkbox" checked={editEmpForm.under18} onChange={e => setEditEmpForm({ ...editEmpForm, under18: e.target.checked })} /></td>
                        <td className="p-2 text-right space-x-3">
                          <button onClick={saveEditEmployee} className="text-green-600 hover:text-green-800">💾</button>
                          <button onClick={() => setEditEmpId(null)} className="text-gray-500 hover:text-gray-700">❌</button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={emp.id} className="hover:bg-gray-50 group">
                        <td className="p-3">{emp.name}</td>
                        <td className="p-3 text-gray-600">{emp.role}</td>
                        <td className="p-3 text-center">{emp.under18 ? '✅' : '-'}</td>
                        <td className="p-3 text-right space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditEmpId(emp.id); setEditEmpForm(emp); }} className="text-blue-500 hover:text-blue-700">✏️</button>
                          <button onClick={() => deleteEmployee(emp.id)} className="text-red-500 hover:text-red-700">🗑️</button>
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Break Rules */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center">
            <span className="mr-2">⏰</span>
            <h3 className="font-bold text-gray-800">Break Rules</h3>
          </div>
          <div className="p-6">
            <p className="text-xs text-gray-500 mb-4">*Note: Under 18s automatically receive minimum 30 min breaks regardless of rules below.</p>
            <div className="space-y-2 mb-6">
              {breakRules.map((rule) => (
                editRuleId === rule.id ? (
                  <div key={rule.id} className="flex items-center gap-1.5 bg-indigo-50 p-2 rounded border text-xs">
                    <input type="number" step="0.01" className="w-12 p-1 border rounded" value={editRuleForm.minHours} onChange={e => setEditRuleForm({ ...editRuleForm, minHours: e.target.value })} />
                    <span>-</span>
                    <input type="number" step="0.01" className="w-12 p-1 border rounded" value={editRuleForm.maxHours} onChange={e => setEditRuleForm({ ...editRuleForm, maxHours: e.target.value })} />
                    <span>hrs</span>
                    <input type="text" className="w-16 p-1 border rounded font-bold ml-auto text-center" value={editRuleForm.breakText} onChange={e => setEditRuleForm({ ...editRuleForm, breakText: e.target.value })} />
                    <span>m</span>
                    <button onClick={saveEditRule} className="text-green-600 hover:text-green-800 ml-1">💾</button>
                    <button onClick={() => setEditRuleId(null)} className="text-gray-500 hover:text-gray-700">❌</button>
                  </div>
                ) : (
                  <div key={rule.id} className="flex items-center justify-between bg-gray-50 p-2 rounded border text-sm group">
                    <span>
                      {rule.maxHours >= 24 ? `${rule.minHours}+ hrs` : `${rule.minHours} - ${rule.maxHours} hrs`}
                    </span>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold">{rule.breakText} mins</span>
                      <button onClick={() => { setEditRuleId(rule.id); setEditRuleForm(rule); }} className="text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity">✏️</button>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>

        {/* Daily Tasks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden col-span-1 lg:col-span-1">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center">
            <span className="mr-2">☑️</span>
            <h3 className="font-bold text-gray-800">Daily Tasks</h3>
          </div>
          <div className="p-6">
            <form onSubmit={e => addListItem(e, tasks, setTasks)} className="flex gap-2 mb-4">
              <input name="item" placeholder="New Task..." className="flex-1 p-2 border rounded text-sm" required />
              <button type="submit" className="bg-indigo-600 text-white px-3 rounded hover:bg-indigo-700">+</button>
            </form>
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {tasks.map((task, idx) => (
                <li key={idx} className="flex justify-between items-center text-sm p-2 bg-gray-50 border rounded group">
                  <span className="truncate flex-1 pr-2">{task}</span>
                  <div className="space-x-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => deleteListItem(idx, tasks, setTasks)} className="text-red-400 hover:text-red-600">🗑️</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* FOH Closedown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden col-span-1 lg:col-span-1">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center">
            <span className="mr-2">☑️</span>
            <h3 className="font-bold text-gray-800">FOH Closedown</h3>
          </div>
          <div className="p-6">
            <form onSubmit={e => addListItem(e, closedownJobs, setClosedownJobs)} className="flex gap-2 mb-4 max-w-md">
              <input name="item" placeholder="New Job..." className="flex-1 p-2 border rounded text-sm" required />
              <button type="submit" className="bg-indigo-600 text-white px-3 rounded hover:bg-indigo-700">+</button>
            </form>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {closedownJobs.map((job, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm p-2 bg-gray-50 border rounded group">
                  <span className="truncate pr-2">{job}</span>
                  <div className="space-x-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => deleteListItem(idx, closedownJobs, setClosedownJobs)} className="text-red-400 hover:text-red-600">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// PRINT PREVIEW (com Drag & Drop FOH / BOH)
// ==========================================
function SheetPreview({ data, employees, tasks, closedownJobs, setData }) {
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const formatManagers = (id1, id2) => {
    const m1 = employees.find(e => e.id.toString() === id1?.toString())?.name;
    const m2 = employees.find(e => e.id.toString() === id2?.toString())?.name;
    if (m1 && m2) return `${m1} / ${m2}`;
    if (m1) return m1;
    if (m2) return m2;
    return '';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return d.toLocaleDateString('en-GB', options);
  };

  const removeShift = (id, type) => {
    if (type === 'AM') setData(prev => ({ ...prev, amShifts: prev.amShifts.filter(s => s.id !== id) }));
    else setData(prev => ({ ...prev, pmShifts: prev.pmShifts.filter(s => s.id !== id) }));
  };

  // Drag & Drop Handlers (FOH só move em FOH, BOH só move em BOH)
  const handleDragStart = (e, row, type) => {
    if (row.empty) return;
    setDraggedItem({ id: row.id, type, isBOH: !!row.isBOH });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, targetRow, type) => {
    if (!draggedItem || targetRow.empty) return;
    const sameSide = draggedItem.type === type;
    const sameGroup = draggedItem.isBOH === !!targetRow.isBOH;
    if (sameSide && sameGroup && draggedItem.id !== targetRow.id) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragOverId !== targetRow.id) {
        setDragOverId(targetRow.id);
      }
    }
  };

  const handleDrop = (e, targetRow, type) => {
    e.preventDefault();
    if (!draggedItem || targetRow.empty) {
      setDraggedItem(null);
      setDragOverId(null);
      return;
    }

    const sameSide = draggedItem.type === type;
    const sameGroup = draggedItem.isBOH === !!targetRow.isBOH;

    if (sameSide && sameGroup && draggedItem.id !== targetRow.id) {
      const shiftKey = type === 'AM' ? 'amShifts' : 'pmShifts';
      setData(prev => {
        const currentShifts = [...prev[shiftKey]];
        const group = currentShifts.filter(s => !!s.isBOH === !!targetRow.isBOH);
        const otherGroup = currentShifts.filter(s => !!s.isBOH !== !!targetRow.isBOH);

        const fromIndex = group.findIndex(s => s.id === draggedItem.id);
        const toIndex = group.findIndex(s => s.id === targetRow.id);

        if (fromIndex === -1 || toIndex === -1) return prev;

        const [moved] = group.splice(fromIndex, 1);
        group.splice(toIndex, 0, moved);

        const updatedShifts = targetRow.isBOH
          ? [...otherGroup, ...group]
          : [...group, ...otherGroup];

        return { ...prev, [shiftKey]: updatedShifts };
      });
    }

    setDraggedItem(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverId(null);
  };

  const processShifts = (shiftsList, prefix) => {
    const foh = shiftsList.filter(s => !s.isBOH);
    const boh = shiftsList.filter(s => s.isBOH);

    const combined = [...foh];
    if (boh.length > 0) {
      if (combined.length > 0) {
        combined.push({ id: `${prefix}-spacer`, empty: true, isSpacer: true });
      }
      combined.push(...boh);
    }

    let padCount = 0;
    while (combined.length < 14) {
      combined.push({ id: `${prefix}-pad-${padCount++}`, empty: true });
    }

    combined.push({ id: `${prefix}-manual-1`, empty: true });
    combined.push({ id: `${prefix}-manual-2`, empty: true });

    return combined;
  };

  const amRows = processShifts(data.amShifts, 'am');
  const pmRows = processShifts(data.pmShifts, 'pm');

  const printTasks = [...tasks, '', ''];
  const printJobs = [...closedownJobs, '', ''];

  const renderShiftTable = (rows, type) => (
    <table className="w-full text-[10px] table-fixed border-collapse">
      <thead className="bg-gray-200 text-center border-b-[2px] border-gray-800">
        <tr>
          <th className="w-[19%] border-r border-gray-400 py-1 font-semibold">Position</th>
          <th className="w-[35%] border-r border-gray-400 py-1 font-semibold">{type} - Nandoca's</th>
          <th className="w-[13%] border-r border-gray-400 py-1 font-semibold">Break</th>
          <th className="w-[11%] border-r border-gray-400 py-1 font-semibold">Gone</th>
          <th className="w-[11%] border-r border-gray-400 py-1 font-semibold">Back</th>
          <th className="w-[11%] py-1 font-semibold">Sign</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const isBeingDragged = draggedItem && draggedItem.id === row.id;
          const isDropTarget = dragOverId === row.id;
          return (
            <tr
              key={row.id}
              draggable={!row.empty}
              onDragStart={(e) => handleDragStart(e, row, type)}
              onDragOver={(e) => handleDragOver(e, row, type)}
              onDrop={(e) => handleDrop(e, row, type)}
              onDragEnd={handleDragEnd}
              className={`border-b border-gray-400 text-center h-[17px] group ${
                row.isBOH ? 'bg-gray-200' : 'bg-white'
              } ${!row.empty ? 'cursor-grab active:cursor-grabbing' : ''} ${
                isBeingDragged ? 'opacity-40' : ''
              } ${isDropTarget ? 'border-t-2 border-t-indigo-600' : ''}`}
            >
              <td className={`border-r border-gray-400 font-semibold truncate px-0.5 ${row.isSpacer ? '' : row.isBOH ? 'bg-gray-300' : 'bg-gray-100'}`}>
                {row.empty && !row.isSpacer ? '' : row.role}
              </td>
              <td className="border-r border-gray-400 relative px-1 truncate">
                {!row.empty && (
                  <span className="noprint text-gray-400 mr-1 select-none text-[9px]">⋮⋮</span>
                )}
                {row.empty ? '' : `${row.name} ${row.timeStr}`}
                {!row.empty && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeShift(row.id, type);
                    }}
                    className="noprint absolute right-1 top-0 text-red-500 hidden group-hover:block px-1 font-bold text-xs"
                  >
                    x
                  </button>
                )}
              </td>
              <td className="border-r border-gray-400 text-[9px] whitespace-nowrap">
                {row.empty ? '' : (row.breakText && row.breakText !== '0' ? row.breakText : 'x')}
              </td>
              <td className="border-r border-gray-400"></td>
              <td className="border-r border-gray-400"></td>
              <td></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div className="w-full h-full flex flex-col border-[2px] border-gray-800 bg-white shadow-sm print:shadow-none box-border leading-tight">

      {/* Header */}
      <div className="grid grid-cols-4 border-b-[2px] border-gray-800 text-center font-bold bg-gray-200">
        <div className="col-span-4 py-1 border-b border-gray-400 text-sm">
          {data.location} <br />
          <span className="text-xs font-normal">{formatDate(data.date)}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 border-b-[2px] border-gray-800 text-center bg-gray-200 divide-x-[2px] divide-gray-800">
        <div className="py-0.5 flex flex-col items-center justify-center h-9">
          <span className="text-[10px] uppercase font-semibold">AM Manager</span>
          <span className="text-[11px] bg-white w-full border-t border-gray-400 font-bold h-full flex items-center justify-center truncate px-1">
            {formatManagers(data.amManagerId1, data.amManagerId2)}
          </span>
        </div>
        <div className="py-0.5 flex flex-col items-center justify-center h-9">
          <span className="text-[10px] uppercase font-semibold">Split Manager</span>
          <span className="text-[11px] bg-white w-full border-t border-gray-400 font-bold h-full flex items-center justify-center truncate px-1">
            {formatManagers(data.splitManagerId1, data.splitManagerId2)}
          </span>
        </div>
        <div className="py-0.5 flex flex-col items-center justify-center h-9">
          <span className="text-[10px] uppercase font-semibold">PM Manager</span>
          <span className="text-[11px] bg-white w-full border-t border-gray-400 font-bold h-full flex items-center justify-center truncate px-1">
            {formatManagers(data.pmManagerId1, data.pmManagerId2)}
          </span>
        </div>
        <div className="py-0.5 flex flex-col items-center justify-center h-9">
          <span className="text-[10px] uppercase font-semibold">Today's Forecast</span>
          <span className="text-[11px] bg-white w-full border-t border-gray-400 font-bold h-full flex items-center justify-center">
            €{data.forecastToday || '0'}
          </span>
        </div>
      </div>

      {/* Shifts */}
      <div className="flex border-b-[2px] border-gray-800 flex-1">
        <div className="w-1/2 border-r-[2px] border-gray-800 flex flex-col">
          {renderShiftTable(amRows, 'AM')}
        </div>
        <div className="w-1/2 flex flex-col">
          {renderShiftTable(pmRows, 'PM')}
        </div>
      </div>

      {/* Middle Checklists */}
      <div className="flex border-b-[2px] border-gray-800">
        <div className="w-[40%] border-r-[2px] border-gray-800 flex flex-col justify-start">
          <div className="w-full text-[10px]">
            {printTasks.map((task, i) => (
              <div key={i} className="flex border-b border-gray-400 h-[17px]">
                <div className="flex-1 py-0.5 px-1 border-r border-gray-400 truncate">{task}</div>
                <div className="w-8"></div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-[30%] border-r-[2px] border-gray-800 flex flex-col">
          <div className="bg-gray-200 font-bold text-center py-0.5 border-b-[2px] border-gray-800 text-[11px]">
            FOH Closedown Jobs
          </div>
          <table className="w-full text-[10px] table-fixed border-collapse">
            <thead className="bg-gray-100 text-center border-b border-gray-400">
              <tr>
                <th className="w-1/2 border-r border-gray-400 py-0.5 font-semibold">Job:</th>
                <th className="w-1/2 py-0.5 font-semibold">Nandoca:</th>
              </tr>
            </thead>
            <tbody>
              {printJobs.map((job, i) => (
                <tr key={i} className="border-b border-gray-400 text-center h-[16px]">
                  <td className="border-r border-gray-400 text-left px-1 truncate">{job}</td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Forecast / AOB */}
        <div className="w-[30%] flex flex-col bg-gray-100">
          <div className="bg-gray-200 font-bold text-center py-0.5 border-b-[2px] border-gray-800 text-[11px]">
            Tomorrow's Forecast
          </div>
          <div className="h-[34px] flex items-center justify-center border-b-[2px] border-gray-800 bg-white">
            <span className="text-2xl font-black leading-none">€{data.forecastTomorrow || '0'}</span>
          </div>
          <div className="bg-gray-200 text-center py-0.5 border-b border-gray-400 text-[11px] font-semibold">
            AOB
          </div>
          <div className="flex-1 bg-white"></div>
        </div>
      </div>

      {/* Bottom Metrics */}
      <div className="flex h-[68px]">
        <div className="w-[20%] border-r border-gray-400 flex flex-col bg-gray-300">
          <div className="text-center text-[10px] font-semibold py-0.5 border-b border-gray-800 bg-gray-400">Out of date</div>
          <div className="flex-1 bg-gray-300"></div>
        </div>
        <div className="w-[20%] border-r-[2px] border-gray-800 flex flex-col bg-gray-400">
          <div className="text-center text-[10px] font-semibold py-0.5 border-b border-gray-800 bg-gray-500 text-white">Out of stock</div>
          <div className="flex-1 bg-gray-400"></div>
        </div>

        <div className="w-[25%] border-r-[2px] border-gray-800 flex flex-col text-[10px] bg-red-900 text-white relative">
          <div className="text-center font-semibold py-0.5 border-b border-red-700 bg-red-950">Defrosted for PM</div>
          <div className="grid grid-cols-2 px-1 pt-0.5 gap-x-2 gap-y-0.5 text-[9px]">
            <div>Beanies:</div><div>Cakes:</div>
            <div>Imitators:</div><div>Livers:</div>
            <div>Pittas:</div><div>Wraps:</div>
          </div>
        </div>

        <div className="w-[35%] flex flex-col text-[10px]">
          <div className="flex h-1/2 border-b-[2px] border-gray-800">
            <div className="w-1/2 border-r-[2px] border-gray-800 flex flex-col relative p-1 bg-gray-300">
              <span className="font-semibold text-gray-700 text-[9px]">AM Nandoca Peri-Point:</span>
              <div className="absolute bottom-1 left-1 right-1 border-b border-black"></div>
            </div>
            <div className="w-1/2 flex flex-col relative p-1 bg-gray-300">
              <span className="font-semibold text-gray-700 text-[9px]">PM Nandoca Peri-Point:</span>
              <div className="absolute bottom-1 left-1 right-1 border-b border-black"></div>
            </div>
          </div>
          <div className="flex h-1/2 bg-gray-300">
            <div className="w-1/2 border-r-[2px] border-gray-800 flex flex-col text-center">
              <div className="border-b border-gray-400 font-semibold py-[1px] text-[9px] leading-tight">Total last week</div>
              <div className="flex-1 bg-white font-bold flex items-center justify-center space-x-1 text-xs leading-none">
                <span>{data.happyCount}😊</span>
                <span>{data.neutralCount}😕</span>
                <span>{data.sadCount}😞</span>
              </div>
            </div>
            <div className="w-1/4 border-r border-gray-400 flex flex-col text-center">
              <div className="border-b border-gray-400 font-semibold py-[1px] text-[9px] leading-tight">NPS</div>
              <div className="flex-1 bg-white font-bold flex items-center justify-center text-red-600 text-[13px] leading-none">{data.npsScore}</div>
            </div>
            <div className="w-1/4 flex flex-col text-center">
              <div className="border-b border-gray-400 font-semibold py-[1px] text-[9px] leading-tight">Food</div>
              <div className="flex-1 bg-white font-bold flex items-center justify-center text-red-600 text-[13px] leading-none">{data.foodScore}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}