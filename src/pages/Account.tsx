import React from "react";
import {Helmet} from "react-helmet-async";
import {PageView, useFirebaseApp, useUser} from "../utils/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword,  } from "firebase/auth";
import {Navigate} from "react-router-dom";

export const SignIn: React.FC = () => {
    const {auth} = useFirebaseApp();
    const inputEmail = React.createRef<HTMLInputElement>();
    const inputPassword = React.createRef<HTMLInputElement>();

    const loginWithEmail = React.useCallback(async () => {
        console.log(await createUserWithEmailAndPassword(auth, inputEmail.current?.value as string, inputPassword.current?.value as string))
    }, [])

    return (
        <>
            <Helmet>
                <title>Sign in</title>
            </Helmet>
            <PageView page_title={'Sign In'} />
            <div className="container">
                <div className={'row'}>
                    <div className={'col'}>
                        <div className="mb-3">
                            <label htmlFor="exampleInputEmail1" className="form-label">Email address</label>
                            <input ref={inputEmail} type="email" className="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" />
                            <div id="emailHelp" className="form-text">We'll never share your email with anyone else.</div>
                        </div>
                        <div className="mb-3">
                            <label htmlFor="exampleInputPassword1" className="form-label">Password</label>
                            <input ref={inputPassword} type="password" className="form-control" id="exampleInputPassword1" />
                        </div>
                        <button type="button" className="btn btn-primary" onClick={loginWithEmail}>Submit</button>
                    </div>
                </div>

            </div>
        </>
    )
}

export const LogIn: React.FC = () => {
    const {auth} = useFirebaseApp();
    const user = useUser();
    const inputEmail = React.createRef<HTMLInputElement>();
    const inputPassword = React.createRef<HTMLInputElement>();

    const loginWithEmail = React.useCallback(async () => {
        try {
            await signInWithEmailAndPassword(auth, inputEmail.current?.value as string, inputPassword.current?.value as string)

        } catch (e) {

        }
    }, [])

    return (
        <>
            <Helmet>
                <title>Log in</title>
            </Helmet>
            {user && <Navigate to={'/'} replace={true} />}
            <PageView page_title={'Log In'} />
            <div className="container">
                <div className={'row'}>
                    <div className={'col'}>
                        <div className="mb-3">
                            <label htmlFor="exampleInputEmail1" className="form-label">Email address</label>
                            <input ref={inputEmail} type="email" className="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" />
                            <div id="emailHelp" className="form-text">We'll never share your email with anyone else.</div>
                        </div>
                        <div className="mb-3">
                            <label htmlFor="exampleInputPassword1" className="form-label">Password</label>
                            <input ref={inputPassword} type="password" className="form-control" id="exampleInputPassword1" />
                        </div>
                        <button type="button" className="btn btn-primary" onClick={loginWithEmail}>Submit</button>
                    </div>
                </div>
            </div>
        </>
    )
}

export const Account: React.FC = () => {
    return (
        <>
            <Helmet>
                <title>Your preferences</title>
            </Helmet>
        </>
    )
}
