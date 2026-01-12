import { createBrowserRouter } from 'react-router';
import App from './App';
import ErrorPage from './components/ErrorPage';

const routes = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
  },
]);

export default routes;
