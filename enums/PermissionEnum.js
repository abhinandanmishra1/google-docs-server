const PermissionsEnum = {
  VIEW: 1,
  EDIT: 2,
  ADMIN: 4,
  ALL: 8,
};

const getAccessRole = (permission) => {
  if (permission & PermissionsEnum.ALL) {
    return "owner";
  }
  if (permission & PermissionsEnum.ADMIN) {
    return "admin";
  } 
  if (permission & PermissionsEnum.EDIT) {
    return "editor";
  }

  return "viewer";
};

module.exports = {
  PermissionsEnum,
  getAccessRole,
};
