import { initializeApp, applicationDefault } from "firebase-admin/app";

export const getFirebaseApp = () => {
  return initializeApp({
    credential: applicationDefault(),
  });
};
