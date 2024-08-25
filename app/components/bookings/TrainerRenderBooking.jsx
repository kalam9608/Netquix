import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  bookingsState,
  updateBookedSessionScheduledMeetingAsync,
} from "../common/common.slice";
import { AccountType, BookedSession } from "../../common/constants";
import { Button } from "reactstrap";
import { X } from "react-feather";
import Modal from "../../common/modal";
import { authState } from "../auth/auth.slice";
import { Utils } from "../../../utils/utils";

const TrainerRenderBooking = ({
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
  report,
  bookedSession,
  setBookedSession,
  tabBook,
  startMeeting,
  setStartMeeting,
  handleAddRatingModelState,
  updateParentState,
}) => {
  const { scheduledMeetingDetails, addRatingModel } = useAppSelector(bookingsState);
  const { accountType } = useAppSelector(authState);
  const dispatch = useAppDispatch()

  const isCompleted =
    has24HoursPassedSinceBooking ||
    scheduledMeetingDetails[booking_index]?.ratings?.trainee;

  const canShowRatingButton =
    !isUpcomingSession &&
    !isCurrentDateBefore &&
    !isStartButtonEnabled &&
    status !== BookedSession.booked &&
    !isCompleted;

  const updateBookedStatusApi = (_id, booked_status) => {
    if (_id) {
      const updatePayload = {
        id: _id,
        booked_status: booked_status,
      };
      const payload = {
        ...(accountType === AccountType?.TRAINER
          ? { status: tabBook, updatePayload }
          : { updatePayload }),
      };
      dispatch(updateBookedSessionScheduledMeetingAsync(payload));
    }
  }

  const handleClick = () => {
    isStartButtonEnabled
      ? updateParentState(booking_index)
      : updateParentState(null); // Calling the function passed from parent
  };

  return (
    <React.Fragment>
      {status !== BookedSession.canceled && isMeetingDone && (
        <h3 className="mt-1">Completed</h3>
      )}
      <span>
        <span>
          {trainee_info?.fullname} shared the following clips with you.{" "}
        </span>
        <span
          onClick={() => {
            if (trainee_clips?.length > 0) setSelectedClips(trainee_clips);
            setIsOpenID(_id);
            setIsOpen(!isOpen);
          }}
          style={{ textDecoration: "underline", cursor: "pointer" }}
        >
          click here
        </span>{" "}
        to view Clip
      </span>
      <br />
      {status === BookedSession.canceled && isMeetingDone && (
        <button
          className="btn btn-danger button-effect btn-sm ml-4 my-1"
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
      )}
      {!isUpcomingSession &&
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
                  className={`btn btn-primary button-effect btn-sm mr-2 btn_cancel my-1`}
                  type="button"
                  style={{
                    cursor: status === BookedSession.confirmed && "not-allowed",
                  }}
                  disabled={status === BookedSession.confirmed}
                  onClick={() => {
                    setBookedSession({
                      ...bookedSession,
                      id: _id,
                      booked_status: BookedSession.confirmed,
                    });
                    updateBookedStatusApi(_id, BookedSession.confirmed);
                  }}
                >
                  {status === BookedSession.confirmed
                    ? BookedSession.confirmed
                    : BookedSession.confirm}
                </button>
              )}
              {status === BookedSession.confirmed && (
                <button
                  className={`btn btn-primary button-effect btn-sm mr-2 btn_cancel my-1`}
                  type="button"
                  disabled={!isStartButtonEnabled}
                  style={{
                    cursor: !isStartButtonEnabled ? "not-allowed" : "pointer",
                  }}
                  onClick={() => {
                    handleClick();
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
                className={`btn btn-danger button-effect btn-sm btn_cancel my-1`}
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
                    (status === BookedSession?.booked ||
                      status === BookedSession?.confirmed)
                  ) {
                    setBookedSession({
                      ...bookedSession,
                      id: _id,
                      booked_status: BookedSession.canceled,
                    });
                    updateBookedStatusApi(_id, BookedSession.canceled);
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
      )}

      <Modal
        isOpen={isOpen}
        element={
          <>
            <div className="container media-gallery portfolio-section grid-portfolio ">
              <div className="theme-title">
                <div className="media">
                  <div className="media-body media-body text-right">
                    <div
                      className="icon-btn btn-sm btn-outline-light close-apps pointer"
                      onClick={() => {
                        setIsOpen(false);
                      }}
                    >
                      {" "}
                      <X />{" "}
                    </div>
                  </div>
                </div>
              </div>
              <div className="d-flex flex-column  align-items-center">
                <h1 className="p-3">
                  {trainee_info.fullname} shared the following clips with you.
                </h1>
                {selectedClips?.length ? (
                  <div>
                    <div className={`block-content`}>
                      <div className="row">
                        {selectedClips?.map((clp, index) => (
                          <>
                            <div
                              key={index}
                              className="col-md-6 col-sm-12 col-xs-12 p-2"
                            >
                              <div className="col">
                                <dl className="row">
                                  <h3 className="ml-1">{clp?.title || "-"}</h3>
                                </dl>
                              </div>
                              <video className="videoStyle" controls>
                                <source
                                  src={Utils?.generateVideoURL(clp)}
                                  type="video/mp4"
                                />
                              </video>
                            </div>
                          </>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <></>
                )}
              </div>
              <div className="justify-content-center"></div>
            </div>
          </>
        }
      />
    </React.Fragment>
  );
};

export default TrainerRenderBooking;
