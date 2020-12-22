import React, { Component } from 'react';
import './App.css';
import {BrowserRouter as Router,Switch, Route, Redirect} from 'react-router-dom';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import {GetUser} from './services/userservice';
import { withAlert } from 'react-alert';
 
import Dashboard from './components/Dashboard';
import Signup from './components/Signup';
import Login from './components/Login';

class App extends Component {
  
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      triedLogins: 0,
    };
    this.assignUser = this.assignUser.bind(this);
  }

  componentDidMount() {
    GetUser(this.assignUser);
  }

  assignUser(err, user) {
    if (err && err.message !== "") {
      if (err.message === "no such user was found" && this.state.triedLogins === 0) {
        this.setState({ triedLogins: 1});
        return;
      }
      this.props.alert.show(err.message);
    }else{
      if (this.state.user) {
        // Overwrite
        this.setState({user: null});
      }
      console.log("Im inside this cool state now, ", user)
      localStorage.setItem("user", JSON.stringify(user.toObject()));
      this.setState({ user: user.toObject()});
    }  
   
  }

  
  render() {                                                                                                                                                                                                                                                                                                                                                  
      return (
        <>
        <Router>
          {this.state.user ? <Redirect to="/dashboard"/> : null}
          <Switch>
            <ProtectedRoute path="/dashboard" user={this.state.user} component={Dashboard} />
            <Route path="/authenticate/sign-in" exact render={(props) => <Login assignUser={this.assignUser} />}/>
            <Route path="/authenticate/sign-up" exact render={(props) => <Signup assignUser={this.assignUser} />}/>
            <Route path="*" render={(props) => <Login assignUser={this.assignUser} />}/>
            </Switch>
        </Router>
        </>
      )
  }
  
}
// ProtectedRoute is a piece of borrowed code to reroute users if not logged in
const ProtectedRoute = ({ component: Comp, user, path, ...rest }) => {
  return (
    <Route
      path={path}
      {...rest}
      render={props => {
        return user ? (
          <Comp {...props} />
        ) : (
          <Redirect
            to={{
              pathname: "/authenticate/sign-in",
              state: {
                prevLocation: path,
                error: "You need to login first!",
              },
            }}
          />
        );
      }}
    />
  );
};


export default withAlert()(App);
