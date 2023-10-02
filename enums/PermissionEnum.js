const PermissionsEnum = {
    VIEW: 1,
    EDIT: 2,
    ALL: 4,
}

const getAccessRole = (permission) => {
    if (permission & PermissionsEnum.ALL ) {
        return "admin";
    }
    else if (permission & PermissionsEnum.EDIT) {
        return "editor";
    }
    
    return "viewer";
}

module.exports = {
    PermissionsEnum,
    getAccessRole
}