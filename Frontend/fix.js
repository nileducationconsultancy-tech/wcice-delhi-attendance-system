const fs = require('fs');

const path = require('path');

const empPath = path.join(__dirname, 'src/pages/EmployeeManagement.jsx');
let emp = fs.readFileSync(empPath, 'utf8');

// Fix axios
emp = emp.replace('const res = await axios.get(/api/employees?page= + page + &search= + search + &status= + statusFilter, { withCredentials: true });', 
                  'const res = await axios.get(\'/api/employees?page=\' + page + \'&search=\' + search + \'&status=\' + statusFilter, { withCredentials: true });');

emp = emp.replace('await axios.patch(/api/employees/\\/status, { status: newStatus }, { withCredentials: true });',
                  'await axios.patch(\/api/employees/\/status\, { status: newStatus }, { withCredentials: true });');

emp = emp.replace('if (window.confirm(Are you sure you want to \\ this employee?)) {',
                  'if (window.confirm(\Are you sure you want to \ this employee?\)) {');

// Fix links
emp = emp.replace('<Link to={/admin/employees/\\} className="font-semibold text-slate-900 hover:text-blue-600">{emp.name}</Link>',
                  '<Link to={\/admin/employees/\\} className="font-semibold text-slate-900 hover:text-blue-600">{emp.name}</Link>');

emp = emp.replace('<Link to={/admin/employees/edit/\\} className="p-2 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-200 rounded-lg shadow-sm transition-all" title="Edit">',
                  '<Link to={\/admin/employees/edit/\\} className="p-2 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-200 rounded-lg shadow-sm transition-all" title="Edit">');

// Fix currency
emp = emp.replace('?{emp.baseSalary ? emp.baseSalary.toLocaleString(\'en-IN\') : \'0\'}/mo',
                  '?{emp.baseSalary ? emp.baseSalary.toLocaleString(\'en-IN\') : \'0\'}/mo');

// Fix className
emp = emp.replace('className={px-2.5 py-1 text-xs font-semibold rounded-full \\}>',
                  'className={\px-2.5 py-1 text-xs font-semibold rounded-full \\}>');


fs.writeFileSync(empPath, emp, 'utf8');


const addPath = path.join(__dirname, 'src/pages/AddEditEmployee.jsx');
let add = fs.readFileSync(addPath, 'utf8');

add = add.replace('const res = await axios.get(/api/employees/\\, { withCredentials: true });',
                  'const res = await axios.get(\/api/employees/\\, { withCredentials: true });');

add = add.replace('await axios.put(/api/employees/\\, formData, { withCredentials: true });',
                  'await axios.put(\/api/employees/\\, formData, { withCredentials: true });');

fs.writeFileSync(addPath, add, 'utf8');

console.log("Fixes applied successfully.");
