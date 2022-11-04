import React from "react";
import { HelmetProvider } from "react-helmet-async";
import {
  HashRouter,
  Route,
  Routes,
  Link,
  NavLink,
  NavLinkProps,
} from "react-router-dom";
import { useAppDispatch } from "./app/hooks";
import { verifyAndAddFeed } from "./app/slice/feeds";
import logoSrc from "./logo.svg";

import { Home } from "./pages/Home";

const BootstrapNavLink: React.FC<NavLinkProps> = (props) => {
  return (
    <NavLink
      {...props}
      className={({ isActive }) =>
        `${props.className} ${isActive ? "active" : ""}`
      }
    >
      {props.children}
    </NavLink>
  );
};

const App: React.FC = () => {
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    process.env.NODE_ENV !== "production" &&
      dispatch(verifyAndAddFeed("https://www.lemonde.fr/rss/une.xml") as any);
  }, []);

  const helmetContext = {};
  return (
    <HelmetProvider context={helmetContext}>
      <HashRouter>
        <div className="container">
          <header className="d-flex flex-wrap justify-content-center py-3 mb-4 border-bottom">
            <Link
              to={"/"}
              className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-dark text-decoration-none"
            >
              <span className="fs-4"></span>
              <img src={logoSrc} height={40} />
            </Link>

            <ul className="nav nav-pills">
              <li className="nav-item">
                <BootstrapNavLink to={"/"} className="nav-link">
                  Home
                </BootstrapNavLink>
              </li>
            </ul>
          </header>
        </div>
        <Routes>
          <Route path="/" element={<Home />}></Route>
        </Routes>
      </HashRouter>
    </HelmetProvider>
  );
};

export default App;
