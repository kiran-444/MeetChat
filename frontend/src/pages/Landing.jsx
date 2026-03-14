import React from "react";
import "../App.css";
import { Link, useNavigate } from "react-router-dom";

export default function Landing() {
    const router = useNavigate();

    return (
        <div className="landingPageContainer">
            <nav className="navBar">
                <div className="navHeader" onClick={() => router("/")}>
                    <h2>MeetChat</h2>
                </div>
                <div className="navList">
                    <div onClick={() => router("/123")} role="button" className="navBtn loginBtn">Join as Guest</div>
                    <div onClick={() => router("/auth")} role="button" className="navBtn loginBtn">Register</div>
                    <div onClick={() => router("/auth")} role="button" className="navBtn loginBtn">Login</div>
                </div>
            </nav>

            <div className="landingMainContainer">
                <div className="textContent">
                    <h2>Connect with your loved ones</h2>
                    <p>Cover the distance with MeetChat</p>
                    <div role="button" className="getStartedBtn">
                        <Link to={"/auth"}>Get started</Link>
                    </div>
                </div>
                <div className="imageContainer">
                    <img src="/mobile.png" alt="App Preview" />
                </div>
            </div>
        </div>
    );
}