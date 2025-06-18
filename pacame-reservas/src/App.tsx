import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import CustomerView from './components/CustomerView';
import LoginForm from './components/LoginForm';
import ProtectedRoute from './components/ProtectedRoute';
import ManagerDashboard from './components/ManagerDashboard';

const App: React.FC = () => {
  const { user } = useAuth();

  return (
    <Router>
      <Switch>
        <Route exact path="/" component={CustomerView} />
        <Route path="/login" component={LoginForm} />
        <ProtectedRoute path="/manager" component={ManagerDashboard} user={user} />
      </Switch>
    </Router>
  );
};

export default App;