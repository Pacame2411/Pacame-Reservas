import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import CustomerView from '../components/CustomerView';
import ReservationForm from '../components/ReservationForm';
import LoginForm from '../components/LoginForm';
import ProtectedRoute from '../components/ProtectedRoute';
import ManagerDashboard from '../components/ManagerDashboard';

const Routes = () => {
    return (
        <Router>
            <Switch>
                <Route exact path="/" component={CustomerView} />
                <Route path="/r/:restaurantSlug" component={ReservationForm} />
                <Route path="/login" component={LoginForm} />
                <ProtectedRoute path="/manager" component={ManagerDashboard} />
            </Switch>
        </Router>
    );
};

export default Routes;