import { useState } from "react";
import useAsyncEffect from "./useAsyncEffect";
import { isAuthAction } from "../actions/auth";
import { Optional } from "../types/common";
import { eventEmitter } from "../config/clients/eventEmitter";
import { EMITTER_EVENTS } from "../constants";

export default function useIsAuth() {
  const [isAuth, setIsAuth] = useState<Optional<boolean>>();

  useAsyncEffect(async () => {
    const { isAuth: currentAuth } = await isAuthAction();
    setIsAuth(currentAuth);

    const handleSignIn = () => setIsAuth(true);
    const handleSignOut = () => setIsAuth(false);

    eventEmitter.on(EMITTER_EVENTS.SIGN_IN, handleSignIn);
    eventEmitter.on(EMITTER_EVENTS.SIGN_OUT, handleSignOut);

    return () => {
      eventEmitter.off(EMITTER_EVENTS.SIGN_IN, handleSignIn);
      eventEmitter.off(EMITTER_EVENTS.SIGN_OUT, handleSignOut);
    };
  }, []);

  return { isAuth };
}
