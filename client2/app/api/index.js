import { ORIGIN_URL } from "../const";
const auth = {
  login: () => {
    return `${ORIGIN_URL}/login`;
  },
};
export const endpoint = {
  auth,
};
