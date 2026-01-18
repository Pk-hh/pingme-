import React from 'react';
import { Button } from '@mui/material';
import './Login.css';
import { auth, provider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

function Login() {
    const signIn = () => {
        signInWithPopup(auth, provider)
            .then((result) => {
                console.log(result);
            })
            .catch((error) => {
                alert(error.message);
            });
    };

    return (
        <div className="login">
            <div className="login__container">
                <img
                    src="/logo.png"
                    alt="PingMe Logo"
                />
                <div className="login__text">
                    <h1>Sign in to PingMe</h1>
                </div>

                <Button type="submit" onClick={signIn} className="login__btn">
                    Sign In With Google
                </Button>
            </div>
        </div>
    );
}

export default Login;
