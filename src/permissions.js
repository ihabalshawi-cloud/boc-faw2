import { storage } from "./utils";

const PERMISSIONS_DEF = {
  FULL_ACCESS:       { label:"صلاحية كاملة",        icon:"🛡" },
  MANAGE_USERS:      { label:"إدارة الموظفين",       icon:"👥" },
  VIEW_LOGIN_HIST:   { label:"سجل الدخول",          icon:"📋" },
  KILL_SESSIONS:     { label:"إنهاء جلسات",         icon:"🔌" },
  MANAGE_ROLES:      { label:"إدارة الصلاحيات",     icon:"🔑" },
  MANAGE_EQUIPMENT:  { label:"إدارة المعدات",        icon:"⚙" },
  MANAGE_SPAREPARTS: { label:"إدارة قطع الغيار",    icon:"🔧" },
  MANAGE_INVENTORY:  { label:"إدارة المخزن والأثاث", icon:"📦" },
  APPROVE_REQUESTS:  { label:"الموافقة على الطلبات",icon:"✅" },
  SYSTEM_SETTINGS:   { label:"إعدادات النظام",       icon:"🔩" },
  VIEW_AUDIT:        { label:"سجل التعديلات",        icon:"📊" },
};
const BUILT_IN_ROLES = {
  SUPER_ADMIN:       { label:"مسؤول الشعبة", color:"bg-red-100 text-red-800",      permissions:["FULL_ACCESS"] },
  ADMIN:             { label:"مدير إداري",    color:"bg-blue-100 text-blue-800",    permissions:["VIEW_LOGIN_HIST","VIEW_AUDIT","KILL_SESSIONS"] },
  MAINTENANCE:       { label:"مدير صيانة",   color:"bg-orange-100 text-orange-800", permissions:["MANAGE_EQUIPMENT","MANAGE_SPAREPARTS"] },
  WAREHOUSE_MANAGER: { label:"مسؤول المخزن", color:"bg-teal-100 text-teal-800",     permissions:["MANAGE_INVENTORY"] },
  EMPLOYEE:          { label:"موظف",          color:"bg-gray-100 text-gray-700",    permissions:[] },
};
function getEmpStatus(empId) { return storage.get(`emp_status_${empId}`, { active:true, role:"EMPLOYEE" }); }
function setEmpStatus(empId, val) { storage.set(`emp_status_${empId}`, val); }
function hasPermission(emp, perm) {
  if (!emp) return false;
  const s = getEmpStatus(emp.id);
  const roleName = s.role || (emp.role === "admin" ? "SUPER_ADMIN" : emp.role === "inventory_manager" ? "WAREHOUSE_MANAGER" : "EMPLOYEE");
  const roleDef = BUILT_IN_ROLES[roleName] || BUILT_IN_ROLES.EMPLOYEE;
  const denyPerms = s.denyPerms || [];
  if (denyPerms.includes(perm)) return false;
  const basePerms = roleDef.permissions || [];
  const extraPerms = s.extraPerms || [];
  return [...basePerms, ...extraPerms].some(p => p === "FULL_ACCESS" || p === perm);
}

export { PERMISSIONS_DEF, BUILT_IN_ROLES, getEmpStatus, setEmpStatus, hasPermission };
