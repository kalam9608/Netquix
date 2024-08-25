import React, { useContext, useEffect, useLayoutEffect } from "react";
import FevoriteSection from "./fevoriteSection";
import DocumentSection from "./documentSection";
import ContactListSection from "./contactListSection";
import NotificationSection from "./notificationSection";
import SettingSection from "./settingSection";
import StatusSection from "./statusSection";
import RecentSection from "./recentSection";
import { Fragment, useState } from "react";
import { NavLink, TabContent, TabPane } from "reactstrap";
import { useRouter } from "next/router";
import "./index.scss"
import { Tooltip } from "react-tippy";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "../../app/store";
import { authAction, authState } from "../../app/components/auth/auth.slice";
import {
  AccountType,
  LOCAL_STORAGE_KEYS,
  MOBILE_SIZE,
  POSITION_FIXED_SIDEBAR_MENU,
  leftSideBarOptions,
  routingPaths,
  topNavbarOptions,
} from "../../app/common/constants";
import { SocketContext } from "../../app/components/socket";
import TodoSection from "../rightSidebar/todoSection";
import ReminderSection from "../rightSidebar/reminderSection";
import NoteSection from "../rightSidebar/noteSection";
import FileSection from "../rightSidebar/fileSection";
import AppListSection from "../rightSidebar/appList";
import { Book, File, ChevronLeft, ChevronRight } from "react-feather";
import BookLessonIcon from "../../public/assets/images/online-lesson.png"
import {
  bookingsAction,
  bookingsState,
} from "../../app/components/common/common.slice";
import { useMediaQuery } from "../../app/hook/useMediaQuery";
import Transaction from "../../app/components/transaction";
const { isMobileFriendly, isSidebarToggleEnabled } = bookingsAction;
const steps = [
  {
    selector: ".step1",
    content: "Check Status here",
  },
  {
    selector: ".step2",
    content: "You can change settings by clicking here",
  },
  {
    selector: ".step3",
    content: "Change mode",
  },
  {
    selector: ".step4",
    content: "Start chat",
  },
];

const Index = (props) => {
  // const width = useWindowSize();
  const socket = useContext(SocketContext);
  const { sidebarActiveTab, sidebarModalActiveTab, topNavbarActiveTab } = useAppSelector(authState);
  const [width, setWidth] = useState(0);
  const [opentour, setopentour] = useState(true);
  let [activeTab, setActiveTab] = useState(null);
  const [mode, setMode] = useState(false);
  const router = useRouter();
  const [size, setSize] = useState([0, 0]);
  const [accountType, setAccountType] = useState("");
  const dispatch = useAppDispatch();
  const bookingState = useAppSelector(bookingsState);
  const { handleActiveTab } = bookingsAction;
  useEffect(() => {
    setAccountType(localStorage.getItem(LOCAL_STORAGE_KEYS.ACC_TYPE));
  }, []);

  useEffect(() => {
    if (localStorage.getItem("layout_mode") === "dark") {
      setMode(true);
    }
  }, []);

  useEffect(() => {
    console.log(`window.innerWidth --- `, window.innerWidth);
    function updateSize() {
      setSize(window.innerWidth);
      setWidth(window.innerWidth);
      if (window.innerWidth < MOBILE_SIZE) {
        // for mobile device
        dispatch(isMobileFriendly(true));
        console.log(`size === `, window.innerWidth);
      } else {
        dispatch(isMobileFriendly(false));
      }
    }
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (activeTab) {
      if (bookingState.configs?.sidebar?.isMobileMode) {
        document?.querySelector(".main-nav")?.classList?.remove("on");
      }
      dispatch(handleActiveTab(activeTab));
    }
  }, [activeTab]);

  useEffect(() => {
    if (bookingState.sidebarTab) {
      TogglTab(bookingState.sidebarTab);
    }
    console.log("TogglTab", bookingState.sidebarTab);
  }, [bookingState.sidebarTab]);

  const CloseAppSidebar = () => {
    document.querySelector(".chitchat-main").classList.remove("small-sidebar");
    document.querySelector(".app-sidebar").classList.remove("active");
    document.body.className = `main-page ${localStorage.getItem(
      "layout_mode"
    )}`;
  };

  useEffect(() => {
    setActiveTab(sidebarActiveTab === leftSideBarOptions?.TOPNAVBAR ? topNavbarActiveTab : sidebarActiveTab);
  }, [sidebarActiveTab, topNavbarActiveTab])

  useEffect(() => {
    setActiveTab(sidebarModalActiveTab);
  }, [sidebarModalActiveTab])

  const TogglTab = (value) => {

    dispatch(authAction.setActiveTab(value));
    // // document.querySelector(".recent-default").classList.remove("active");
    if (
      width < 800 &&
      document &&
      document.querySelector &&
      document.querySelector(".app-sidebar")
    ) {
      document.querySelector(".app-sidebar").classList.remove("active");
    }
  };

  const ToggleTab = (tab) => {
    dispatch(authAction?.setActiveModalTab(tab));
    if (width > 1640 && document.querySelector(".chitchat-main")) {
      document
        .querySelector(".chitchat-main")
        .classList.remove("small-sidebar");
    }
  };

  const closeTour = () => {
    setopentour(false);
  };

  const toggleLightMode = (modes) => {
    if (modes) {
      setMode(!modes);
      document.body.className += "sidebar-active main-page";
      localStorage.setItem("layout_mode", "");
    } else {
      setMode(!modes);
      document.body.className += "sidebar-active main-page dark";
      localStorage.setItem("layout_mode", "dark");
    }
  };

  const Logout = () => {
    socket.disconnect();
    localStorage.clear();
    router.push("/auth/signIn");
    dispatch(authAction.updateIsUserLoggedIn());
  };

  const smallSideBarToggle = () => {
    if (document && document.querySelector(".chitchat-main")) {
      document.querySelector(".chitchat-main").classList.add("small-sidebar");
    }
    setActiveTab("");
  };

  const isMobile = useMediaQuery(450)
  const [openCloseToggleSideNav, setOpenCloseToggleSideNav] = useState(true)

  useEffect(() => {
    // let getDashboard = document.querySelector("#get-dashboard");
    let getNavbarTabs = document.querySelector("#get-navbar-tabs");
    let getBookings = document.querySelector("#bookingsTab");

    let customSidebarContentBooking = document.querySelector(".custom-sidebar-content-booking");
    let lockerDrawer = document.querySelector(".custom-mobile-menu.active")

    if (lockerDrawer) {
      lockerDrawer.style?.setProperty('margin-left', '105px', ''); // Set margin-left to 105px
      lockerDrawer.style?.setProperty('max-width', 'calc(100vw - 105px)', ''); // Set max-width to calc(100vw - 105px)
    }
    if (getBookings) {
      getBookings.style.marginLeft = openCloseToggleSideNav ? '105px' : "30px";
    }
    // if (getDashboard) {
    //   getDashboard.style.marginLeft = openCloseToggleSideNav ? '105px' : "30px";
    // }
    if (getNavbarTabs) {
      if (isMobile) {
        getNavbarTabs.style.marginLeft ="100px";
      } else {
        getNavbarTabs.style.marginLeft = openCloseToggleSideNav ? '105px' : '30px';
      }
    }
    if (customSidebarContentBooking) {
      customSidebarContentBooking?.style?.setProperty('left', openCloseToggleSideNav ? '100px' : '0px', 'important');
    }
  }, [openCloseToggleSideNav, sidebarModalActiveTab, sidebarActiveTab, activeTab])

  useEffect(() => {
    if (isMobile) {
      setOpenCloseToggleSideNav(true)
    } else {
      setOpenCloseToggleSideNav(true)
    }
  }, [isMobile])

  const width1000 = useMediaQuery(1000)

  return (
    <Fragment>
      {/* <AppListSection
          activeTab={activeTab}
          CloseAppSidebar={CloseAppSidebar}
          ToggleTab={ToggleTab}
        /> */}
      <div id="left-nav-wrapper" className="left-nav-wrapper">
        {openCloseToggleSideNav &&
          <aside
            className={`main-nav on custom-scroll ${openCloseToggleSideNav && "open"} ${accountType === AccountType.TRAINEE &&
              POSITION_FIXED_SIDEBAR_MENU.includes(activeTab) &&
              "custom-sidebar"
              }`}
            style={(width1000 || topNavbarActiveTab === topNavbarOptions?.MEETING_ROOM) ? {} : { paddingTop: "0px" }}
          >
            {/* logo section */}
            {(width1000 || topNavbarActiveTab === topNavbarOptions?.MEETING_ROOM) && <div className="logo-warpper">
              <Link href="/landing">
                <img id="Net"
                  src="/assets/images/logo/netquix-logo.png"
                  alt="logo"
                  className="custom-image"

                />
              </Link>
            </div>}


            <div className="app-list sidebar-main">
              {/* <ul className="sidebar-top  custom-scroll">
            <li>
              <Tooltip title="Home" position="top" trigger="mouseenter">
                <NavLink
                  className={`icon-btn btn-light button-effect ${activeTab === "home" ? "active" : ""
                    }`}
                  onClick={() => TogglTab("home")}
                >
                  <i className="fa fa-home"></i>
                </NavLink>
              </Tooltip>
            </li>
            <li>
              <Tooltip
                title={
                  accountType === AccountType.TRAINEE
                    ? "Booking"
                    : "Schedule Slots"
                }
                position="right-end"
                trigger="mouseenter"
              >
                <NavLink
                  className={`icon-btn btn-light button-effect ${activeTab === leftSideBarOptions.SCHEDULE_TRAINING
                    ? "active"
                    : ""
                    }`}
                  onClick={() => TogglTab(leftSideBarOptions.SCHEDULE_TRAINING)}
                >
                  <i className="fa fa-calendar"></i>
                </NavLink>
              </Tooltip>
            </li>
            <li><Link className={`icon-btn btn-outline-primary btn-sm button-effect ${activeTab === "todo" ? "active" : ""}`} href="#" onClick={() => ToggleTab("todo")}><Book /></Link>
            </li>

          </ul> */}
              <ul className="sidebar-top">
                <li>
                  <Tooltip title="My Locker" position="top-end"
                      size="small" trigger="mouseenter">
                    <NavLink id="sidebar-item-home"
                      className={`icon-btn btn-light button-effect ${activeTab === topNavbarOptions?.HOME ? "active" : ""
                        }`}
                      onClick={() => { dispatch(authAction?.setTopNavbarActiveTab(topNavbarOptions?.HOME)) }}
                    >
                      <i className="fa fa-home" />
                    </NavLink>
                  </Tooltip>
                  <p className="menu-name">My Locker</p>
                </li>
                {accountType === AccountType.TRAINEE && <li>
                  <Tooltip
                    title={
                      accountType === AccountType.TRAINEE
                        ? "Booking"
                        : "Schedule Slots"
                    }
                    position="top"
                    trigger="mouseenter"
                  >
                    <NavLink id="sidebar-item-booking"
                      className={`icon-btn btn-light button-effect ${activeTab === leftSideBarOptions.SCHEDULE_TRAINING
                        ? "active"
                        : ""
                        }`}
                      onClick={() => TogglTab(leftSideBarOptions.SCHEDULE_TRAINING)}
                    >
                      <i className="fa fa-calendar" />
                    </NavLink>
                  </Tooltip>
                  <p className="menu-name">Booking</p>
                </li>}
                {accountType === AccountType?.TRAINEE && <li>
                  <Tooltip title="Book Lessons" trigger="mouseenter" position="top-end"
                    size="small">
                    <NavLink id="sidebar-item-locker"
                      className={`icon-btn btn-light button-effect step2 ${activeTab === topNavbarOptions?.BOOK_LESSON ? "active" : ""
                        }`}
                      onClick={() => { dispatch(authAction?.setTopNavbarActiveTab(topNavbarOptions?.BOOK_LESSON)) }}
                      data-intro=""
                    >
                      {activeTab === topNavbarOptions?.BOOK_LESSON
                        ? <img src={"../assets/images/online-lesson-white.png"} alt="Book Lesson" style={{ width: 20 }} />
                        : <img src={"../assets/images/online-lesson.png"} alt="Book Lesson" style={{ width: 20 }} />
                      }

                    </NavLink>
                  </Tooltip>
                  <p className="menu-name">Book Lessons</p>
                </li>}
                <li>
                  <Tooltip title="My Uploads"  position="top-end"
                      size="small" trigger="mouseenter">
                    <NavLink id="sidebar-item-locker"
                      className={`icon-btn btn-light button-effect step2 ${activeTab === "file" ? "active" : ""
                        }`}
                      onClick={() => ToggleTab("file")}
                      data-intro=""
                    >
                      {activeTab === "file"
                        ? <img src="../assets/images/lockers-white.png" style={{ width: 20 }} />
                        : <img src="../assets/images/lockers.png" style={{ width: 20 }} />
                      }
                      {/* <i className="fa fa-lock" /> */}
                    </NavLink>
                  </Tooltip>
                  <p className="menu-name">My Uploads</p>
                </li>
                {/* <li>
              <Tooltip title="Chats" position="top" trigger="mouseenter">
                <NavLink
                  className={`icon-btn btn-light button-effect ${
                    activeTab === "chats" ? "active" : ""
                  }`}
                  onClick={() => TogglTab("chats")}
                >
                  <i className="fa fa-comment"></i>
                </NavLink>
              </Tooltip>
            </li> */}

                {/* some menu hide feedback changes */}
                {/* <li>
              <Tooltip title="Todo" position="top" trigger="mouseenter">
                <NavLink
                  className={`icon-btn btn-light button-effect ${
                    activeTab === "todo" ? "active" : ""
                  }`}
                  onClick={() => ToggleTab("todo")}
                >
                  <i className="fa fa-list" />
                </NavLink>
              </Tooltip>
            </li>
            <li>
              <Tooltip title="Notes" position="top" trigger="mouseenter">
                <NavLink
                  className={`icon-btn btn-light button-effect ${
                    activeTab === "notes" ? "active" : ""
                  }`}
                  onClick={() => ToggleTab("notes")}
                >
                  <i className="fa fa-book" />
                </NavLink>
              </Tooltip>
            </li>
            <li>
              <Tooltip title="Reminder" position="top" trigger="mouseenter">
                <NavLink
                  className={`icon-btn btn-light button-effect ${
                    activeTab === "reminder" ? "active" : ""
                  }`}
                  onClick={() => ToggleTab("reminder")}
                >
                  <i className="fa fa-clock-o" />
                </NavLink>
              </Tooltip>
            </li>
            <li>
              <Tooltip title="Favourite" position="top" trigger="mouseenter">
                <NavLink
                  className={`icon-btn btn-light button-effect ${
                    activeTab === "fevorite" ? "active" : ""
                  }`}
                  onClick={() => ToggleTab("fevorite")}
                >
                  <i className="fa fa-star" />
                </NavLink>
              </Tooltip>
            </li> */}

                {/* <li>
              <Tooltip title="Document" position="top" trigger="mouseenter">
                <NavLink
                  className={`icon-btn btn-light button-effect ${
                    activeTab === "document" ? "active" : ""
                  }`}
                  onClick={() => TogglTab("document")}
                >
                  {" "}
                  <i className="fa fa-file-text"></i>
                </NavLink>
              </Tooltip>
            </li> */}
                {/* <li>
              <Tooltip title="Contact" position="top" trigger="mouseenter">
                <NavLink
                  className={`icon-btn btn-light button-effect ${
                    activeTab === "contact" ? "active" : ""
                  }`}
                  onClick={() => TogglTab("contact")}
                >
                  {" "}
                  <i className="fa fa-users"></i>
                </NavLink>
              </Tooltip>
            </li> */}

                  {accountType === AccountType?.TRAINER && <li>
                  <Tooltip title="Upcoming Sessions" trigger="mouseenter" position="top-end" size="small"
                    >
                    <NavLink id="sidebar-item-upcoming"
                      className={`icon-btn btn-light button-effect step2 ${activeTab === topNavbarOptions?.UPCOMING_SESSION ? "active" : ""
                        }`}
                      onClick={() => { dispatch(authAction?.setTopNavbarActiveTab(topNavbarOptions?.UPCOMING_SESSION)) }}
                      data-intro=""
                    >
                      {activeTab === topNavbarOptions?.UPCOMING_SESSION
                        ? <img src={"../assets/images/online-lesson-white.png"} alt="Book Lesson" style={{ width: 20 }} />
                        : <img src={"../assets/images/online-lesson.png"} alt="Book Lesson" style={{ width: 20 }} />
                      }

                    </NavLink>
                  </Tooltip>
                  <p className="menu-name">Upcoming Sessions</p>
                </li>}

                <li>
                  <div className="dot-btn dot-danger grow">
                    <Tooltip
                      title="Notification"
                      position="top-end"
                      size="small"
                      trigger="mouseenter"
                    >
                      <NavLink id="sidebar-item-notification"
                        className={`icon-btn btn-light button-effect ${activeTab === "notification" ? "active" : ""
                          }`}
                        onClick={() => ToggleTab("notification")}
                      >
                        <i className="fa fa-bell" />
                      </NavLink>
                    </Tooltip>
                  </div>
                  <p className="menu-name">Notification</p>
                </li>

                <li>
                  <Tooltip title="Settings" position="top" trigger="mouseenter">
                    <NavLink id="sidebar-item-setting"
                      className={`icon-btn btn-light button-effect step2 ${activeTab === "setting" ? "active" : ""
                        }`}
                      onClick={() => ToggleTab("setting")}
                      data-intro="You can change settings by clicking here"
                    >
                      <i className="fa fa-cog" />
                    </NavLink>
                  </Tooltip>
                  <p className="menu-name">Settings</p>
                </li>
                <li>
                  <Tooltip
                    title="Change Mode"
                    size="small"
                    position="top-end"
                    trigger="mouseenter"
                  >
                    <NavLink
                      id="sidebar-item-mode"
                      className="icon-btn btn-light button-effect mode step3"
                      data-intro="Change mode"
                      onClick={() => toggleLightMode(mode)}
                    >
                      <i className={mode ? "fa fa-lightbulb-o" : "fa fa-moon-o"} />
                    </NavLink>
                  </Tooltip>
                  <p className="menu-name" style={{ color: "black", fontWeight: "500" }}>Change Mode</p>
                </li>
                {/* {accountType === AccountType?.TRAINER && */}
                  <li>
                    {/* <div className="dot-btn dot-danger grow"> */}
                      <Tooltip
                        title="Transaction"
                        position="top-end"
                        size="small"
                        trigger="mouseenter"
                      >
                        <NavLink id="sidebar-item-setting"
                          className={`icon-btn btn-light button-effect step2 ${activeTab === "transaction" ? "active" : ""
                            }`}
                          onClick={() => ToggleTab("transaction")}
                        >
                          <i class="fa fa-exchange" aria-hidden="true" />
                        </NavLink>
                      </Tooltip>
                    {/* </div> */}
                    <p className="menu-name">Transaction</p>
                  </li>
                {/* } */}

                <li>
                  <Tooltip title="Logout" position="top" trigger="mouseenter">
                    <NavLink
                      id="sidebar-item-logout"
                      className="icon-btn btn-light"
                      onClick={() => Logout()}
                    >
                      {" "}
                      <i className="fa fa-power-off"> </i>
                    </NavLink>
                  </Tooltip>
                  <p className="menu-name" style={{ color: "black", fontWeight: "500" }}>Logout</p>
                </li>
              </ul>
              {/* <ul className="sidebar-bottom">
                <li>
                  <Tooltip
                    title="Change Mode"
                    size="small"
                    position="top-end"
                    trigger="mouseenter"
                  >
                    <NavLink
                      id="sidebar-item-mode"
                      className="icon-btn btn-light button-effect mode step3"
                      data-intro="Change mode"
                      onClick={() => toggleLightMode(mode)}
                    >
                      <i className={mode ? "fa fa-lightbulb-o" : "fa fa-moon-o"} />
                    </NavLink>
                  </Tooltip>
                  <p className="menu-name" style={{ color: "black", fontWeight: "500" }}>Change Mode</p>
                </li>
                <li>
                  <Tooltip title="Logout" position="top" trigger="mouseenter">
                    <NavLink
                      id="sidebar-item-logout"
                      className="icon-btn btn-light"
                      onClick={() => Logout()}
                    >
                      {" "}
                      <i className="fa fa-power-off"> </i>
                    </NavLink>
                  </Tooltip>
                  <p className="menu-name" style={{ color: "black", fontWeight: "500" }}>Logout</p>
                </li>
              </ul> */}
            </div>
          </aside>}
        {openCloseToggleSideNav ?
          <ChevronLeft id="ChevronLeft" style={{ left: "79px" }} className="collapse-left-drawer-icon" onClick={() => setOpenCloseToggleSideNav(false)} /> :
          !isMobile &&  <ChevronRight id="ChevronRight" style={{ left: "0px" }} className="collapse-left-drawer-icon" onClick={() => setOpenCloseToggleSideNav(true)} /> }
          
          


      </div>
      {activeTab !== leftSideBarOptions.HOME &&
        activeTab !== leftSideBarOptions.SCHEDULE_TRAINING && (
          <aside className="app-sidebar active">
            <div className="apps">
              <div className="apps-ul">
                <TabContent activeTab={activeTab}>
                  <TabPane
                    tabId="todo"
                    className={`${activeTab === "todo" ? "left-90" : ""}`}
                  >
                    <TodoSection
                      smallSideBarToggle={smallSideBarToggle}
                      tab={activeTab}
                      ActiveTab={setActiveTab}
                    />
                  </TabPane>
                  <TabPane
                    tabId="reminder"
                    className={`${activeTab === "reminder" ? "left-90" : ""}`}
                  >
                    <ReminderSection
                      smallSideBarToggle={smallSideBarToggle}
                      tab={activeTab}
                      ActiveTab={setActiveTab}
                    />
                  </TabPane>
                  <TabPane
                    tabId="notes"
                    className={`${activeTab === "notes" ? "left-90" : ""}`}
                  >
                    <NoteSection
                      smallSideBarToggle={smallSideBarToggle}
                      tab={activeTab}
                      ActiveTab={setActiveTab}
                    />
                  </TabPane>
                  <TabPane
                    tabId="document"
                    className={`${activeTab === "document" ? "left-90" : ""}`}
                  >
                    <DocumentSection
                      smallSideBarToggle={smallSideBarToggle}
                      tab={activeTab}
                      ActiveTab={setActiveTab}
                    />
                  </TabPane>
                  <TabPane
                    tabId="fevorite"
                    className={`${activeTab === "fevorite" ? "left-90" : ""}`}
                  >
                    <FevoriteSection
                      smallSideBarToggle={smallSideBarToggle}
                      tab={activeTab}
                      ActiveTab={setActiveTab}
                    />
                  </TabPane>
                  <TabPane
                    tabId="file"
                    className={`${activeTab === "file" ? "custom-mobile-menu" : ""
                      }`}
                  >
                    <FileSection smallSideBarToggle={smallSideBarToggle} />
                  </TabPane>

                  <TabPane
                    tabId="contact"
                    className={`${activeTab === "contact" ? "left-90" : ""}`}
                  >
                    <ContactListSection
                      smallSideBarToggle={smallSideBarToggle}
                      tab={activeTab}
                      ActiveTab={setActiveTab}
                    />
                  </TabPane>
                  <TabPane
                    tabId="notification"
                    className={`${activeTab === "notification"
                      ? "custom-mobile-menu"
                      : ""
                      }`}
                  >
                    <NotificationSection
                      smallSideBarToggle={smallSideBarToggle}
                      tab={activeTab}
                      ActiveTab={setActiveTab}
                    />
                  </TabPane>

                  <TabPane
                    tabId="setting"
                    className={`${activeTab === "setting"
                      ? "custom-mobile-menu"
                      : ""
                      } ${accountType === AccountType.TRAINER
                        ? "sidebar-full-width"
                        : ""
                      }`}
                  >
                    <SettingSection
                      smallSideBarToggle={smallSideBarToggle}
                      tab={activeTab}
                      ActiveTab={setActiveTab}
                    />
                  </TabPane>

                  <TabPane
                    tabId="transaction"
                    className={`${activeTab === "transaction"
                      ? "custom-mobile-menu"
                      : ""
                      } sidebar-full-width`}
                  >
                    <Transaction
                      smallSideBarToggle={smallSideBarToggle}
                      tab={activeTab}
                      ActiveTab={setActiveTab}
                    />
                  </TabPane>

                  <TabPane
                    tabId="status"
                    className={`${activeTab === "status" ? "left-90" : ""}`}
                  >
                    <StatusSection
                      smallSideBarToggle={smallSideBarToggle}
                      tab={activeTab}
                      ActiveTab={setActiveTab}
                    />
                  </TabPane>
                </TabContent>
              </div>
            </div>
          </aside>
        )}
      {bookingState.configs?.sidebar?.isMobileMode && <RecentSection openCloseToggleSideNav={openCloseToggleSideNav} setOpenCloseToggleSideNav={setOpenCloseToggleSideNav} />}
    </Fragment>
  );
};

export default Index;
