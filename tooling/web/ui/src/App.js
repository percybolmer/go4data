import React, { Component } from 'react';
import './App.css';
import {BrowserRouter as Router, Route, Redirect} from 'react-router-dom';
import {GetUser} from './services/userservice';

import Dashboard from './components/Dashboard';
import Login from './components/Login';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null
    };
  }

  componentDidMount() {
    GetUser(this.assignUser.bind(this))
  }

  assignUser(user) {
    this.setState({ user: user});
  }
  render() {
    const user = this.state.user
    if (user){                                                                                                                                                                                                                                                                                                                                                                          
      return (
        <Router>
            <ProtectedRoute path="/" user={this.state.user} exact component={Dashboard} />
            <Route path="/login" exact component={Login} />
        </Router>
      )
    }else {
      return <Login />
    }
  }
  
}
// ProtectedRoute is a piece of borrowed code to reroute users if not logged in
const ProtectedRoute = ({ component: Comp, user, path, ...rest }) => {
  return (
    <Route
      path={path}
      {...rest}
      render={props => {
        console.log(user);
        return user ? (
        
          <Comp {...props} />
        ) : (
          <Redirect
            to={{
              pathname: "/login",
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


export default App;
