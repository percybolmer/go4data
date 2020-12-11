import { Component } from 'react'
import { BrowserRouter as  Route, Link } from "react-router-dom";
import Login from './Login';
import SignUp from './Signup';
import logo from './../logo.svg'
class Authenticate extends Component {
    render() {
        return (
                <div className="Authenticate">
                    <nav className="navbar navbar-expand-lg navbar-light fixed-top">
                        <div className="container">
                            <a class="navbar-brand" href="/authenticate/sign-in">
                                <img src={logo} class="navbar-logo" alt="logo" />
                                <Link className="navbar-brand" to={"/authenticate/sign-in"}>Workflow</Link>
                            </a>
                            
                            <div className="collapse navbar-collapse" id="navbarTogglerDemo02">
                                <ul className="navbar-nav ml-auto">
                                    <li className="nav-item">
                                        <Link className="nav-link" to={"/authenticate/sign-in"}>Login</Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link className="nav-link" to={"/authenticate/sign-up"}>Sign up</Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </nav>

                    <div className="auth-wrapper">
                        <div className="auth-inner">
                            
                                <Route path="/authenticate/sign-in" component={Login} />
                                <Route path="/authenticate/sign-up" component={SignUp} />
                            
                        </div>
                    </div>
                </div>
        )
    };
}

export default Authenticate