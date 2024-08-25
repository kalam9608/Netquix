import { useEffect } from "react";
import { useRouter } from "next/router";
import { LOCAL_STORAGE_KEYS, routingPaths } from "../../common/constants";
import { useAppDispatch, useAppSelector } from "../../store";
import { authState, getMeAsync } from "./auth.slice";

const AuthGuard = ({ children }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isUserLoggedIn } = useAppSelector(authState);
  const path = router.asPath;
  const pathName = router.pathname;
  const authSelector = useAppSelector(authState);

  useEffect(() => {
    if (authSelector.showGoogleRegistrationForm.isFromGoogle) {
      router.push(routingPaths.signUp);
    }
  }, [authSelector.showGoogleRegistrationForm]);

  useEffect(() => {
    const isTokenExists = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN)
      ? true
      : false;
    if (isTokenExists) {
      dispatch(getMeAsync());
      router.push(routingPaths.dashboard);
    } else {
      handlePublicRoutes(pathName, path, router);
    }
  }, [isUserLoggedIn, path]);

  return children;
};

export const handlePublicRoutes = (pathName, path, router) => {
  if (pathName === routingPaths.signUp || pathName === routingPaths.signIn ) {
    router.push(path);
  } else if (pathName === routingPaths.forgetPassword) {
    router.push(path);
  } else if (pathName === routingPaths.verifiedForgetPassword || pathName === routingPaths.landing) {
    router.push(path);
  } else {
    router.push(routingPaths.landing);
  }
};

export default AuthGuard;
