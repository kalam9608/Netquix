import React from "react"
import { useState , useEffect } from "react";
import { Nav,NavItem ,NavLink ,TabContent,TabPane} from "reactstrap";
import { bookingButton } from "../../common/constants";
import classnames from "classnames";
import { useAppSelector,useAppDispatch } from "../../store";
import { bookingsState } from "../common/common.slice";
import { Utils } from "../../../utils/utils";
import { BookedSession } from "../../common/constants";
import { AccountType } from "../../common/constants";
import { traineeAction , traineeState } from "../trainee/trainee.slice";
import BookingList from "./BookingList";
import { awsS3Url } from "../../../utils/constant";

const UpcomingSession = ({accountType = null})=>{
  const [activeTabs, setActiveTab] = useState(bookingButton[0]);
  const [tabBook, setTabBook] = useState(bookingButton[0]);
  const { scheduledMeetingDetails, addRatingModel } = useAppSelector(bookingsState);
  const { activeTab } = useAppSelector(bookingsState);
  const { newBookingData } = useAppSelector(traineeState);
  const [canceledBookings, setCanceledBookings] = useState([]);
  const [completedBookings, setCompletedBookings] = useState([]);

  useEffect(() => {
    if (newBookingData?._id) {
      setIsOpenID(newBookingData?._id)
      setIsOpen(true);
    }
  }, [newBookingData])

  const handleCancelBooking = (bookingId) => {
    console.log("Canceling booking with ID:", bookingId);
    // Perform the cancellation logic, and update the state accordingly
    // For example, you can filter out the canceled booking from scheduledMeetingDetails
    const updatedBookings = scheduledMeetingDetails.filter(
      (booking) => booking._id !== bookingId
    );
    console.log("Updated bookings after cancellation:", updatedBookings);
    // Update the state with the updated bookings
    setCanceledBookings(updatedBookings);
  };

  const handleAddRatingModelState = (data) => {
    console.log("Ratting clicked upcoming page ===", data)
  }

  const getMyClips = async () => {
    var res = await myClips({})
    setClips(res?.data)
  }

  const toggle1 = (tab) => {
    if (activeTabs !== tab) {
      setActiveTab(tab);
    }
  };

  useEffect(() => {
    const canceledBookingsFiltered = scheduledMeetingDetails.filter(
      (booking) => booking.status === BookedSession.canceled
    );
    setCanceledBookings(canceledBookingsFiltered);

    const completedBookingsFiltered = scheduledMeetingDetails.filter(
      (booking) => isMeetingCompleted(booking)
    );
    setCompletedBookings(completedBookingsFiltered);
  }, [scheduledMeetingDetails]);

  const isMeetingCompleted = (detail) => {
    return (
      detail.status === BookedSession.completed ||
      (detail &&
        detail.ratings &&
        detail.ratings[accountType?.toLowerCase()] &&
        detail?.ratings[accountType?.toLowerCase()]?.sessionRating)
    );
  };

  const TraineeRenderBooking = (
    _id,
    status,
    trainee_info,
    trainer_info,
    isCurrentDateBefore,
    isStartButtonEnabled,
    isMeetingDone,
    isUpcomingSession,
    ratings,
    booking_index,
    has24HoursPassedSinceBooking,
    isOpen,
    setIsOpen,
    clips,
    setClips,
    selectedClips,
    setSelectedClips,
    setIsOpenID,
    addTraineeClipInBookedSession,
    trainee_clips,
    report
  ) => {
    const isCompleted =
      has24HoursPassedSinceBooking ||
      scheduledMeetingDetails[booking_index]?.ratings?.trainee;

    const canShowRatingButton =
      !isUpcomingSession &&
      !isCurrentDateBefore &&
      !isStartButtonEnabled &&
      status !== BookedSession.booked &&
      !isCompleted;

    return (
      <React.Fragment>
        {isCompleted ? <h3>Completed</h3> : null}
        {canShowRatingButton ? (
          <button
            className={`btn btn-success button-effect btn-sm mr-4`}
            type="button"
            onClick={() => {
              const payload = {
                _id,
                isOpen: true,
              };
              handleAddRatingModelState(payload);
            }}
          >
            Rating
          </button>
        ) : (
          <React.Fragment>
            {!isMeetingDone && (
              <React.Fragment>
                {status !== BookedSession.canceled && (
                  <React.Fragment>
                    <button
                      className="btn btn-success button-effect btn-sm mr-4 btn_cancel"
                      type="button"
                      onClick={() => {
                        if (trainee_clips?.length > 0) setSelectedClips(trainee_clips)
                        setIsOpenID(_id)
                        setIsOpen(true)
                      }}
                    >
                      Add Clip
                    </button>
                    {status === BookedSession.booked ? (
                      <button
                        className="btn btn-dark button-effect btn-sm mr-4 btn_cancel"
                        type="button"
                        style={{
                          cursor:
                            status === BookedSession.booked && "not-allowed",
                        }}
                        disabled={status === BookedSession.booked}
                      >
                        {BookedSession.booked}
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary button-effect btn-sm mr-4"
                        type="button"
                        style={{
                          cursor:
                            status === BookedSession.confirmed && "not-allowed",
                        }}
                        disabled={status === BookedSession.confirmed}
                      >
                        {BookedSession.confirmed}
                      </button>
                    )}
                    <Modal
                      isOpen={isOpen}
                      element={
                        <div>
                          <div className="theme-title">
                            <div className="media">
                              <div className="media-body media-body text-right">
                                <div className="icon-btn btn-sm btn-outline-light close-apps pointer" onClick={() => {
                                  setIsOpen(false)
                                  dispatch(removeNewBookingData());
                                }} > <X /> </div>
                              </div>
                            </div>
                          </div>
                          <div className="container media-gallery portfolio-section grid-portfolio ">
                            <h2 className="my-5">Feel free to share upto 2 clips with the {trainer_info?.fullname}</h2>
                            {selectedClips?.length ? <div >
                              <h5 className="block-title p-0"> Selected Clips<label className="badge badge-primary sm ml-2">{selectedClips?.length}</label></h5>
                              <div className={`block-content`}>
                                <div className="row">
                                  {selectedClips?.map((clp) => (
                                    <div key={clp?._id} style={{ borderRadius: 5, position: "relative", border: "1px solid #ebebeb", marginLeft: "15px" }} className={`col-5`}>
                                      <video style={{ width: "100%", maxHeight: "200px", height: "100%" }}>
                                        <source src={`${awsS3Url}${clp?._id}`} type="video/mp4" />
                                      </video>
                                      <span
                                        style={{ position: "absolute", right: -5, top: -3, cursor: "pointer", background: "red", borderRadius: "50%", padding: "0px 6px", color: "#fff" }}
                                        onClick={(e) => {
                                          e.stopPropagation(); // Prevent the event from bubbling up
                                          const updatedVideos = selectedClips.filter((video) => video._id !== clp?._id);
                                          setSelectedClips(updatedVideos);
                                        }}
                                      >
                                        x
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div> : <></>}
                            <div style={{ marginTop: "30px" }}></div>
                            {clips?.length && clips?.map((cl, ind) => <div className={`collapse-block ${cl?.show ? "" : "open"}`}>
                              <h5 className="block-title pb-0"> {cl?._id}<label className="badge badge-primary sm ml-2">{cl?.clips?.length}</label></h5>
                              <div className={`block-content ${cl?.show ? "d-none" : ""}`}>
                                <div className="row">
                                  {cl?.clips.map((clp, index) => {
                                    var sld = selectedClips.find(val => val?._id === clp?._id)
                                    return <div
                                      key={index}
                                      className={`col-4 `}
                                      style={{ borderRadius: 5 }}
                                      onClick={() => {
                                        if (!sld && selectedClips?.length < 2) {
                                          selectedClips?.push(clp);
                                          setSelectedClips([...selectedClips]);
                                        }
                                      }}
                                    >
                                      <video style={{ border: `${sld ? "2px" : "0px"} solid green`, width: "98%", maxHeight: "150px", height: "100%" }}  >
                                        <source src={`${awsS3Url}/${clp?._id}`} type="video/mp4" />
                                      </video>
                                    </div>
                                  })}
                                </div>
                              </div>
                            </div>
                            )}
                          </div>
                          <div className="d-flex justify-content-around w-100 p-3">
                            <Button color="success" onClick={() => { addTraineeClipInBookedSession() }}>Share</Button>
                          </div>
                        </div>
                      }
                    />
                  </React.Fragment>
                )}
                {status === BookedSession.confirmed && (
                  <button
                    className="btn btn-primary button-effect btn-sm mr-4"
                    type="button"
                    disabled={!isStartButtonEnabled}
                    style={{
                      cursor: !isStartButtonEnabled ? "not-allowed" : "pointer",
                    }}
                    onClick={() => {
                      setStartMeeting({
                        ...startMeeting,
                        id: _id,
                        isOpenModal: true,
                        traineeInfo: trainee_info,
                        trainerInfo: trainer_info,
                      });
                    }}
                  >
                    {BookedSession.start}
                  </button>
                )}
               <button
          className="btn btn-danger button-effect btn-sm btn_cancel"
          type="button"
          style={{
            cursor:
              status === BookedSession.canceled || isStartButtonEnabled
                ? "not-allowed"
                : "pointer",
          }}
          disabled={
            status === BookedSession.canceled || isStartButtonEnabled
          }
          onClick={() => {
            // Call the handleCancelBooking function with the booking id
            handleCancelBooking(_id);
          }}
        >
          {status === BookedSession.canceled
            ? BookedSession.canceled
            : "Cancel"}
        </button>
              </React.Fragment>
            )}
          </React.Fragment>
        )}

      </React.Fragment>
    );
  };

  const renderBooking = (
    status,
    booking_index,
    booked_date,
    session_start_time,
    session_end_time,
    _id,
    trainee_info,
    trainer_info,
    ratings,
    trainee_clips,
    report
  ) => {
    const availabilityInfo = Utils.meetingAvailability(
      booked_date,
      session_start_time,
      session_end_time
    );
    const {
      isStartButtonEnabled,
      has24HoursPassedSinceBooking,
      isCurrentDateBefore,
      isUpcomingSession,
    } = availabilityInfo;

    const isMeetingDone =
      isMeetingCompleted(scheduledMeetingDetails[booking_index]) ||
      has24HoursPassedSinceBooking;

    switch (accountType) {
      case AccountType.TRAINER:
        return TrainerRenderBooking(
          _id,
          status,
          trainee_info,
          trainer_info,
          isCurrentDateBefore,
          isStartButtonEnabled,
          isMeetingDone,
          isUpcomingSession,
          ratings,
          trainee_clips,
          selectedClips,
          setSelectedClips,
          report
        );
      case AccountType.TRAINEE:
        return TraineeRenderBooking(
          _id,
          status,
          trainee_info,
          trainer_info,
          isCurrentDateBefore,
          isStartButtonEnabled,
          isMeetingDone,
          isUpcomingSession,
          ratings,
          booking_index,
          has24HoursPassedSinceBooking,
          isOpen,
          setIsOpen,
          clips,
          setClips,
          selectedClips,
          setSelectedClips,
          setIsOpenID,
          addTraineeClipInBookedSession,
          trainee_clips,
          report
        );
      default:
        break;
    }
  };

  const TrainerRenderBooking = (
    _id,
    status,
    trainee_info,
    trainer_info,
    isCurrentDateBefore,
    isStartButtonEnabled,
    isMeetingDone,
    isUpcomingSession,
    ratings,
    trainee_clips,
    selectedClips,
    setSelectedClips,
    report
  ) => {
    return (
      <React.Fragment>
        {status !== BookedSession.canceled && isMeetingDone && (
          <h3 className="mt-1">Completed</h3>
        )}
        <span className="px-2">
          <span>{trainee_info?.fullname} shared the following clips with you, give them a look… </span>
          <span onClick={() => {
            if (trainee_clips?.length > 0) setSelectedClips(trainee_clips)
            setIsOpenID(_id);
            setIsOpen(true);
          }} style={{ textDecoration: 'underline', cursor: 'pointer' }} >click here</span> to view Clip
        </span>
        {
          status === BookedSession.canceled && isMeetingDone && (
            <button
              className="btn btn-danger button-effect btn-sm ml-4"
              type="button"
              style={{
                cursor:
                  status === BookedSession.canceled ? "not-allowed" : "pointer",
              }}
              disabled={status === BookedSession.canceled}
            >
              {status === BookedSession.canceled
                ? BookedSession.canceled
                : "Cancel"}
            </button>
          )
        }
        {
          !isUpcomingSession &&
            !isCurrentDateBefore &&
            status === BookedSession.confirmed &&
            !isStartButtonEnabled &&
            !isMeetingDone ? (
            <button
              className={`btn btn-success button-effect btn-sm mr-4`}
              type="button"
              onClick={() => {
                const payload = {
                  _id,
                  isOpen: true,
                  booking_id: _id,
                };
                handleAddRatingModelState(payload);
              }}
            >
              Rating
            </button>
          ) : (
            <React.Fragment>
              {!isMeetingDone && (
                <React.Fragment>
                  {status !== BookedSession.canceled && (
                    <button
                      className={`btn btn-primary button-effect btn-sm mr-2 btn_cancel`}
                      type="button"
                      style={{
                        cursor:
                          status === BookedSession.confirmed && "not-allowed",
                      }}
                      disabled={status === BookedSession.confirmed}
                      onClick={() =>
                        setBookedSession({
                          ...bookedSession,
                          id: _id,
                          booked_status: BookedSession.confirmed,
                        })
                      }
                    >
                      {status === BookedSession.confirmed
                        ? BookedSession.confirmed
                        : BookedSession.confirm}
                    </button>
                  )}
                  {status === BookedSession.confirmed && (
                    <button
                      className={`btn btn-primary button-effect btn-sm mr-2 btn_cancel`}
                      type="button"
                      disabled={!isStartButtonEnabled}
                      style={{
                        cursor: !isStartButtonEnabled ? "not-allowed" : "pointer",
                      }}
                      onClick={() => {
                        setStartMeeting({
                          ...startMeeting,
                          id: _id,
                          isOpenModal: true,
                          traineeInfo: trainee_info,
                          trainerInfo: trainer_info,
                        });
                      }}
                    >
                      {BookedSession.start}
                    </button>
                  )}
                  <button
                    className={`btn btn-danger button-effect btn-sm btn_cancel`}
                    type="button"
                    style={{
                      cursor:
                        status === BookedSession.canceled || isStartButtonEnabled
                          ? "not-allowed"
                          : "pointer",
                    }}
                    disabled={
                      status === BookedSession.canceled || isStartButtonEnabled
                    }
                    onClick={() => {
                      if (
                        !isStartButtonEnabled &&
                        (status === BookedSession.booked ||
                          status === BookedSession.confirmed)
                      ) {
                        setBookedSession({
                          ...bookedSession,
                          id: _id,
                          booked_status: BookedSession.canceled,
                        });
                      }
                    }}
                  >
                    {status === BookedSession.canceled
                      ? BookedSession.canceled
                      : "Cancel"}
                  </button>
                </React.Fragment>
              )}
            </React.Fragment>
          )
        }

        <Modal
          isOpen={isOpen}
          element={
            <>
              <div className="container media-gallery portfolio-section grid-portfolio ">
                <div className="theme-title">
                  <div className="media">

                    <div className="media-body media-body text-right">
                      <div className="icon-btn btn-sm btn-outline-light close-apps pointer" onClick={() => { setIsOpen(false) }} > <X /> </div>
                    </div>
                  </div>
                </div>
                <div className="d-flex flex-column  align-items-center">
                  <h1 className="p-3">{trainee_info.fullname} shared the following clips with you, give them a look…</h1>
                  {selectedClips?.length ? <div >
                    <div className={`block-content`}>
                      <div className="row">
                        {selectedClips.map((clp, index) => (<>
                          <div key={index} className="col-md-6 col-sm-12 col-xs-12 p-2" >
                            <div className="col">
                              <dl className="row">
                                <h3 className="ml-1">{clp?.title || "-"}</h3>
                              </dl>
                            </div>
                            <video className="videoStyle" controls>
                              <source src={`${awsS3Url}${clp?._id}`} type="video/mp4" />
                            </video>

                          </div>
                        </>
                        ))}
                      </div>
                    </div>
                  </div> :
                    <></>
                  }
                </div>
                <div className="justify-content-center">

                </div>
              </div>
            </>
          }
        />
      </React.Fragment >
    );
  };

  const showRatingLabel = (ratingInfo) => {
    // for trainee we're showing recommends
    return ratingInfo &&
      ratingInfo[accountType.toLowerCase()] &&
      (ratingInfo[accountType.toLowerCase()].sessionRating ||
        ratingInfo[accountType.toLowerCase()].sessionRating) ? (
      <div className="d-flex items-center">
        {" "}
        You rated{" "}
        <b className="pl-2">
          {ratingInfo[accountType.toLowerCase()].sessionRating ||
            ratingInfo[accountType.toLowerCase()].sessionRating}
        </b>
        <Star color="#FFC436" size={28} className="star-container star-svg" />{" "}
        to this {accountType?.toLowerCase()}.
      </div>
    ) : null;
  };

  const Bookings = () =>
  scheduledMeetingDetails.map((bookingInfo, booking_index) => {
    const {
      _id,
      trainee_info,
      trainer_info,
      booked_date,
      session_start_time,
      session_end_time,
      status,
      ratings,
      trainee_clips,
      report
    } = bookingInfo;

    return (
      <div
        className="card mb-4 mt-5 trainer-bookings-card"
        key={`booking-schedule-training${booking_index}`}
      >
        <div className="card-body">
          <div className="row">
            <div className="col">
              <dl className="row">
                <dd className="ml-3">Trainer :</dd>
                <dt className="ml-1">{trainer_info.fullname}</dt>
              </dl>
            </div>
            <div className="col">
              <dl className="row ml-1">
                <dd>Date :</dd>
                <dt className="ml-1">{Utils.getDateInFormat(booked_date)}</dt>
              </dl>
            </div>
            <div className="w-100"></div>
            <div className="col">
              <dl className="row">
                <dd className="ml-3">Trainee :</dd>
                <dt className="ml-1">{trainee_info.fullname}</dt>
              </dl>
            </div>
            <div className="col">
              <dl className="row">
                <dd className="ml-3">Time Durations :</dd>
                <dt className="ml-1">{`${Utils.convertToAmPm(
                  session_start_time
                )}-${Utils.convertToAmPm(session_end_time)}`}</dt>
              </dl>
            </div>
          </div>
        </div>
        <div className="card-footer">
          <div className="row">
            <div className="col-11">{showRatingLabel(ratings)}</div>
            <div className="col-12 col-lg-auto ml-lg-auto">
              {renderBooking(
                status,
                booking_index,
                booked_date,
                session_start_time,
                session_end_time,
                _id,
                trainee_info,
                trainer_info,
                ratings,
                trainee_clips,
                report
              )}

            </div>
          </div>
        </div>
      </div>
    );
  });
  return(
    <div>
    <h2 className="d-flex justify-content-center p-5">Session</h2>
    <div 
    className="card rounded" 
    style={{
        maxWidth: "50%",
        width: "auto",
        margin: "auto",
        display: "flex",
        flexDirection: "column",
    }}
    >
      <div className="card-body">
        <Nav tabs>
          {bookingButton.map((tabName, index) => (
            <NavItem key={`bookings_tabs${index}`}>
              <NavLink
                className={`${classnames({
                  active: activeTabs === tabName,
                })} ${activeTabs === tabName ? "text-primary" : "text-dark"
                  } text-capitalize`}
                onClick={() => {
                  toggle1(tabName);
                }}
                style={{ fontSize: "13px" }}
              >
                {tabName}
              </NavLink>
            </NavItem>
          ))}
        </Nav>
        <TabContent activeTab={activeTabs}>
        <TabPane tabId={bookingButton[0]}>
            {activeTabs && scheduledMeetingDetails.length > 0 ? (
              <BookingList bookings={scheduledMeetingDetails} />
            ) : (
              <div style={{ display: "flex", justifyContent: "center", marginTop: "40px" }}>
              <h5 className="block-title">No upcoming Session available</h5>
          </div>
            )}
          </TabPane>
          <TabPane tabId={bookingButton[1]}>
          {canceledBookings.length > 0 ? (
            <BookingList bookings={canceledBookings} />
          ) : (
            <div style={{ display: "flex", justifyContent: "center", marginTop: "40px" }}>
              <h5 className="block-title">No canceled booking</h5>
            </div>
          )}
        </TabPane>
          <TabPane tabId={bookingButton[2]}>
            {completedBookings.length > 0 ? (
              <BookingList bookings={completedBookings} />
            ) : (
              <div style={{ display: "flex", justifyContent: "center", marginTop: "40px" }}>
              <h5 className="block-title">No completed booking</h5>
          </div>
            )}
          </TabPane>
        </TabContent>
      </div>
    </div>
  </div>
  )
}
export default UpcomingSession;