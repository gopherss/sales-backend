const ROLES = Object.freeze({
    ROOT: Symbol('ROOT'),
    ADMIN: Symbol('ADMIN'),
    EMPLOYEE: Symbol('EMPLOYEE')
});

module.exports = {
    ROOT: ROLES.ROOT.description,
    ADMIN: ROLES.ADMIN.description,
    EMPLOYEE: ROLES.EMPLOYEE.description,
};
