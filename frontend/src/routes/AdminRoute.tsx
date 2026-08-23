import { Outlet } from 'react-router-dom';

/** Temporary open route while JWT authorization is disabled. */
export default function AdminRoute() {
  return <Outlet />;
}
