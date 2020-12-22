import React, { Component } from 'react'
import {   Link } from "react-router-dom";
import logo from './../logo.svg'
import {LoginUser} from '../services/userservice'

class Login extends Component {

    constructor(props) {
        super(props)
        this.state = {
            name: "",
            password: "",
        }

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
    }



    handleSubmit(event) {
        event.preventDefault();
        const user = {
            name: this.state.name,
            password: this.state.password,
        }
        LoginUser(user, this.props.assignUser);
    }

    handleInputChange(event) {
        const target = event.target;
        const value = target.value;
        const name = target.name;
        this.setState({
            [name]: value
        });
    }
    render() {
        return (
            <>
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


                            <form onSubmit={this.handleSubmit}>
                                <h3>Sign In</h3>

                                <div className="form-group">
                                    <label>Username</label>
                                    <input type="text" name="name" className="form-control" value={this.state.name} onChange={this.handleInputChange} placeholder="Username" />
                                </div>

                                <div className="form-group">
                                    <label>Password</label>
                                    <input type="password" name="password" className="form-control" value={this.state.password} onChange={this.handleInputChange} placeholder="Enter password" />
                                </div>

                                <button type="submit" className="btn btn-primary btn-block">Login</button>
                            </form>
                        </div>
                    </div>
                </div>

            </>
        );
    }
}

export default Login