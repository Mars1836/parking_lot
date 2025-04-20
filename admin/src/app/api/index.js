const auth = {
  login: (serverUrl) => {
    return `${serverUrl}/login`;
  },
};
const staticFile = (serverUrl, path) => {
  return `${serverUrl}/static${path}`;
};

export const endpoint = {
  auth,
  staticFile,
};
