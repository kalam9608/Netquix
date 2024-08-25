import React, { Fragment, useState, useEffect } from "react";
import LeftSide from "../../containers/leftSidebar";
import ChitChat from "../../containers/chatBoard";
import RightSide from "../../containers/rightSidebar";
import { useAppDispatch, useAppSelector } from "../../app/store";
import { authAction, authState } from "../../app/components/auth/auth.slice";
import {
  AccountType,
  LOCAL_STORAGE_KEYS,
  leftSideBarOptions,
  topNavbarOptions,
} from "../../app/common/constants";
import TraineeDashboardContainer from "../../app/components/trainee/dashboard";
import TrainerDashboardContainer from "../../app/components/trainer/dashboard";
import ScheduleInventory from "../../app/components/trainer/scheduleInventory";
import Bookings from "../../app/components/bookings";
import { SocketContext, getSocket } from "../../app/components/socket";
import {
  getMasterDataAsync,
  masterState,
} from "../../app/components/master/master.slice";
import Header from "../../app/components/Header";
import NavHomePage from "../../app/components/NavHomePage";
import MyCommunity from "../../app/components/myCommunity";
import AboutUs from "../../app/components/aboutUs";
import ContactUs from "../../app/components/contactUs";
import { useMediaQuery } from "../../app/hook/useMediaQuery";
import StudentRecord from "../../app/components/Header/StudentTab/StudentRecord";
import { meetingRoom } from "../../app/components/bookings/BookingList";
import UpcomingSession from "../../app/components/bookings/UpcomingSession";
const Dashboard = () => {
  const dispatch = useAppDispatch();
  const { sidebarActiveTab, topNavbarActiveTab } = useAppSelector(authState);
  const [accountType, setAccountType] = useState("");

  useEffect(() => {
    setAccountType(localStorage.getItem(LOCAL_STORAGE_KEYS.ACC_TYPE));
    // fetching master data, TODO: stop over calling API calls.
    dispatch(getMasterDataAsync());
  }, []);

  const getDashboard = () => {
    switch (accountType) {
      case AccountType.TRAINEE:
        return <TraineeDashboardContainer />;
      case AccountType.TRAINER:
        return <TrainerDashboardContainer accountType={accountType} />;
    }
  };

  const getScheduledInventory = () => {
    return accountType === AccountType.TRAINEE ? (
      <Bookings accountType={accountType} />
    ) : (
      <ScheduleInventory />
    );
  };
  const getNavbarTabs = () => {
    switch (topNavbarActiveTab) {
      case topNavbarOptions?.HOME: {
        return <NavHomePage />;
      }
      case topNavbarOptions?.MY_COMMUNITY: {
        return <MyCommunity />;
      }
      case topNavbarOptions?.STUDENT: {
        return <StudentRecord />;
      }
      case topNavbarOptions?.UPCOMING_SESSION: {
        return <UpcomingSession />;
      }
      case topNavbarOptions?.ABOUT_US: {
        return <AboutUs />;
      }
      case topNavbarOptions?.CONTACT_US: {
        return <ContactUs />;
      }
      case topNavbarOptions?.BOOK_LESSON: {
        return (
          <div id="get-dashboard" className="get-dashboard">
            {getDashboard()}
          </div>
        );
      }
      case topNavbarOptions?.MEETING_ROOM: {
        return meetingRoom();
      }
      default:
        break;
    }
  };

  const getActiveTabs = () => {
    switch (sidebarActiveTab) {
      case leftSideBarOptions.CHATS:
        return (
          <React.Fragment>
            <ChitChat />
            <RightSide />
          </React.Fragment>
        );

      case leftSideBarOptions.TOPNAVBAR: {
        return (
          <div id="get-navbar-tabs" className="get-navbar-tabs">
            {getNavbarTabs()}
          </div>
        );
      }

      case leftSideBarOptions.SCHEDULE_TRAINING:
        return getScheduledInventory();
      default:
        break;
    }
  };

  useEffect(() => {
    dispatch(authAction?.setTopNavbarActiveTab(topNavbarOptions?.HOME));
  }, []);

  const width1000 = useMediaQuery(1000);

  return (
    // TODO: move socket to root folder
    <Fragment>
      <SocketContext.Provider value={getSocket()}>
        {/* height-max-content */}
        {!width1000 &&
          topNavbarActiveTab !== topNavbarOptions?.MEETING_ROOM && <Header />}
        <div
          className={`chitchat-container sidebar-toggle ${
            accountType === AccountType.TRAINEE ? "" : ""
          }`}
          style={{
            marginTop:
              width1000 || topNavbarActiveTab === topNavbarOptions?.MEETING_ROOM
                ? "0px"
                : "80px",
          }}
        >
          <LeftSide />
          {getActiveTabs()}
        </div>
      </SocketContext.Provider>
    </Fragment>
  );
};

export default Dashboard;
