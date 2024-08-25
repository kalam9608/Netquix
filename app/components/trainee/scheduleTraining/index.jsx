import React, { useEffect, useState, useContext } from "react";
import DatePicker from "react-datepicker";
import moment from "moment";
import "../scheduleTraining/index.scss";
import { Popover } from "react-tiny-popover";
import PopupContent from "./PopupContent";
import { useRouter } from "next/router";
import Slider from "react-slick";
import ShareModalTrainee from "../../bookings/start/SelectClips";



import {
  BookedSession,
  DefaultTimeRange,
  FormateHours,
  Message,
  STATUS,
  TRAINER_AMOUNT_USD,
  TimeRange,
  debouncedConfigs,
  leftSideBarOptions,
  minimumMeetingDurationInMin,
  params,
  weekDays,
} from "../../../common/constants";
import { Utils } from "../../../../utils/utils";
import { useAppDispatch, useAppSelector } from "../../../store";
import {
  bookSessionAsync,
  createPaymentIntentAsync,
  getTraineeWithSlotsAsync,
  traineeAction,
  traineeState,
} from "../trainee.slice";
import { Nav, NavItem, NavLink } from "reactstrap";
import TrainerSlider from "./trainerSlider";
import Modal from "../../../common/modal";
import { X } from "react-feather";
import StripeCard from "../../../common/stripe";
import { toast } from "react-toastify";
import SearchableDropdown from "../helper/searchableDropdown";
import { masterState } from "../../master/master.slice";
import { TrainerDetails } from "../../trainer/trainerDetails";
import { bookingsAction, bookingsState } from "../../common/common.slice";
import { debounce } from "lodash";
import {
  checkSlotAsync,
  commonAction,
  commonState,
} from "../../../common/common.slice";
import CustomRangePicker from "../../../common/timeRangeSlider";
import { getTrainersAsync, trainerAction, trainerState } from "../../trainer/trainer.slice";
import { authAction, authState } from "../../auth/auth.slice";
import { SocketContext } from "../../socket";
import Category from "../../../../pages/landing/category";
import { myClips, shareClips, traineeClips } from "../../../../containers/rightSidebar/fileSection.api";
import { getAvailability } from "../../calendar/calendar.api";

import { addTraineeClipInBookedSessionAsync } from "../../common/common.slice";
import { useSelector } from "react-redux";
import Header from "../../Header";
import ShareClipsCard from "../../share-clips";


const settings = {
  autoplay: false,
  infinite: true,
  speed: 2000,
  slidesToShow: 6,
  slidesToScroll: 1,
  swipetoslide: true,
  autoplaySpeed: 1000,
  // arrows:false,
  responsive: [
    {
      breakpoint: 1000,
      settings: {
        autoplay: false,
        slidesToShow: 4,
      },
    },
    {
      breakpoint: 500,
      settings: {
        autoplay: false,
        slidesToShow: 2,
      },
    },
    {
      breakpoint: 350,
      settings: {
        autoplay: false,
        slidesToShow: 1,
      },
    },
  ],
};

const { isSidebarToggleEnabled } = bookingsAction;
const { removePaymentIntent } = traineeAction;
const ScheduleTraining = () => {
  const socket = useContext(SocketContext);
  const masterRecords = useAppSelector(masterState).master;
  const [data, setData] = useState();
  const { userInfo, sidebarModalActiveTab } = useAppSelector(authState);

  useEffect(() => {
    setData(masterRecords?.masterData);
  }, [masterRecords]);

  const dispatch = useAppDispatch();
  const { status, getTraineeSlots, transaction } = useAppSelector(traineeState);
  const { trainersList, selectedTrainerInfo } = useAppSelector(trainerState);
  const { configs } = useAppSelector(bookingsState);
  const [availableSlotsState, setAvailableSlotsState] = useState([])
  const { isSlotAvailable, session_durations, availableSlots } =
    useAppSelector(commonState);
  const { selectedTrainerId } = useAppSelector(bookingsState);
  const { master } = useAppSelector(masterState);
  const [startDate, setStartDate] = useState();
  const [isPopoverOpen, setIsPopoverOpen] = useState(null);
  const [getParams, setParams] = useState(params);
  const [categoryList, setCategoryList] = useState([]);
  const [bookingColumns, setBookingColumns] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [listOfTrainers, setListOfTrainers] = useState([]);
  const [bookingTableData, setBookingTableData] = useState([]);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [trainer, setTrainer] = useState({ trainer_id: "" });
  const [timeRange, setTimeRange] = useState({
    startTime: "",
    endTime: "",
  });
  const [clips, setClips] = useState([]);
  const [selectedClips, setSelectedClips] = useState([]);
  const [trainee, setTrainee] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [err, setErr] = useState({ email: false, video: false });

 

  const handleSelectClip = () => {
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    getmyClips()
  }, [])

  const addTraineeClipInBookedSession = async () => {
    const payload = { id: isOpenID, trainee_clip: selectedClips?.map(val => val?._id) };
    dispatch(addTraineeClipInBookedSessionAsync(payload));
    dispatch(removeNewBookingData());
    setIsOpen(false)
    setIsModalOpen(false);
  }

  const getmyClips = async () => {
    setStartDate(new Date())
    var res = await myClips({})
    setClips(res?.data)
  }

  const [popup, setPopup] = useState(false)
  const router = useRouter();

  const togglePopup = () => {
    setPopup(!popup);
  };


  useEffect(() => {
    const handleScroll = () => {
      // You can add more logic here if needed
      // For now, just prevent the default behavior of scrolling
      if (popup) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'visible';
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.style.overflow = 'visible'; // Ensure the default behavior is restored
    };
  }, [popup]);



  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const onShare = async () => {
    if (!emailRegex.test(userEmail)) setErr({ email: true, video: false });
    else
      if (!selectedClips?.length) setErr({ email: false, video: true });
      else {
        var res = await shareClips({ user_email: userEmail, clips: selectedClips })
        toast.success("Email sent successfully.", { type: "success" })
        setErr({ email: false, video: false })
      }
  }

  const [selectedTrainer, setSelectedTrainer] = useState({
    id: null,
    trainer_id: null,
    data: {},
  });
  useEffect(() => {
    const currentDateAndtime = () => {
      // Create a new Date object for the current date
      const currentDate = new Date(startDate);

      // Get the year, month, and day components
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Adding 1 because months are zero-based
      const day = String(currentDate.getDate()).padStart(2, '0');

      // Format the date in the desired format
      const formattedDate = `${year}-${month}-${day}`;

      return formattedDate
    }
    if (selectedTrainer?.trainer_id) {

      var date = new Date().toISOString().split("T")[0];
      var dateArr = date?.split("-");
      let start_time = new Date(Number(dateArr[0]), Number(dateArr[1]) - 1, Number(dateArr[2]), 0, 0, 0, 0).toISOString()
      let end_time = new Date(Number(dateArr[0]), Number(dateArr[1]) - 1, Number(dateArr[2]), 23, 59, 0, 0).toISOString()

      getAvailability({
        trainer_id: selectedTrainer?.trainer_id,
        start_time: start_time,
        end_time: end_time
      }).then((res) => { setAvailableSlotsState(res?.data); })
    }

    //   // console.log("new Date(startDate).toISOStringnew Date(startDate).toISOString", moment(new Date(`${startDate}`).toISOString()).format('YYYY-MM-DD'))
  }, [selectedTrainer?.trainer_id])

  // useEffect(() => {
  //   if (selectedTrainer?.trainer_id) {
  //     let date = new Date(startDate).toISOString().split("T")[0];
  //     let dateArr = date?.split("-");
  //     let start_time = new Date(Number(dateArr[0]), Number(dateArr[1]) - 1, Number(dateArr[2]), 0, 0, 0, 0).toISOString()
  //     let end_time = new Date(Number(dateArr[0]), Number(dateArr[1]) - 1, Number(dateArr[2]), 23, 59, 0, 0).toISOString()
  //     getAvailability({
  //       trainer_id: selectedTrainer?.trainer_id,
  //       start_time: start_time,
  //       end_time: end_time
  //     }).then((res) => {
  //       setAvailableSlotsState(res?.data);
  //     })
  //   }
  // }, [startDate])



  const [query, setQuery] = useState("");

  const [isOpenInstantScheduleMeeting, setInstantScheduleMeeting] =
    useState(false);
  const [trainerInfo, setTrainerInfo] = useState({
    userInfo: null,
    selected_category: null,
  });


  useEffect(() => {
    selectedTrainerInfo && setTrainerInfo(JSON.parse(JSON.stringify(selectedTrainerInfo)))
    selectedTrainerInfo?.selected_category && setParams({ search: selectedTrainerInfo?.selected_category });
  }, [selectedTrainerInfo?.selected_category])


  const [bookSessionPayload, setBookSessionPayload] = useState({});
  const toggle = () => setInstantScheduleMeeting(!isOpenInstantScheduleMeeting);

  const Logout = () => {
    socket.disconnect();
    localStorage.clear();
    router.push("/auth/signIn");
    dispatch(authAction.updateIsUserLoggedIn());
  };

  const closePopup = () => {
    setPopup(false);
  };

  useEffect(() => {
    if (getParams.search) {
      dispatch(getTraineeWithSlotsAsync(getParams));
    }
  }, [getParams]);

  useEffect(() => {
    dispatch(getTrainersAsync());
  }, []);

  useEffect(() => {
    const todaySDate = Utils.getDateInFormat(new Date());
    const { weekDates, weekDateFormatted } =
      Utils.getNext7WorkingDays(todaySDate);
    // setTableData(getTraineeSlots, weekDates);
    setColumns(weekDateFormatted);
    setListOfTrainers(
      getTraineeSlots.map((trainer) => {
        return {
          id: trainer._id,
          trainer_id: trainer.trainer_id,
          background_image: trainer?.profilePicture,
          isActive: true,
          category: trainer?.category,
          name: trainer?.fullname,
          isCategory: false,
          extraInfo: trainer.extraInfo,
          is_kyc_completed: trainer?.is_kyc_completed,
          stripe_account_id: trainer?.stripe_account_id,
          commission: trainer?.commission ?? 5,
        };
      })
    );
  }, [getTraineeSlots]);

  useEffect(() => {
    setTrainers(
      trainersList.map((trainer) => {
        const { id, fullname, profile_picture, category, extraInfo } = trainer;
        return {
          id,
          isActive: true,
          isCategory: false,
          name: fullname,
          background_image: profile_picture,
          category,
          extraInfo,
        };
      })
    );
  }, [trainersList]);

  useEffect(() => {
    const { masterData } = master;
    setCategoryList([]);
    if (masterData && masterData.category && masterData.category.length) {
      const payload = masterData.category.map((category) => {
        return { id: category, name: category, isCategory: true };
      });
      setCategoryList(payload);
    }
  }, [master]);

  useEffect(() => {
    if (
      transaction &&
      transaction?.intent &&
      transaction?.intent?.result &&
      transaction?.intent.result?.client_secret
    ) {
      setShowTransactionModal(true);
    }
  }, [transaction]);


  useEffect(() => {
    if (!selectedTrainerInfo) {
      setTrainerInfo((prev) => ({
        ...prev,
        userInfo: null,
      }));
    }
  }, []);

  useEffect(() => {
    if (!selectedTrainerInfo) {
      setTrainerInfo((prev) => ({
        ...prev,
        userInfo: undefined,
        selected_category: undefined,
      }));
    }
  }, []);

  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (selectedTrainer?.trainer_id || trainerInfo?.userInfo?.trainer_id) {
      const bookingDate = Utils.getDateInFormatIOS(startDate);
      const payload = {
        booked_date: bookingDate,
        trainer_id:
          trainerInfo?.userInfo?.trainer_id || selectedTrainer?.trainer_id,
        slotTime: {
          from: trainerInfo?.userInfo?.extraInfo?.working_hours
            ? Utils.getTimeFormate(
              trainerInfo.userInfo.extraInfo.working_hours?.from
            )
            : DefaultTimeRange.startTime,
          to: trainerInfo?.userInfo?.extraInfo?.working_hours
            ? Utils.getTimeFormate(
              trainerInfo.userInfo.extraInfo.working_hours?.to
            )
            : DefaultTimeRange.endTime,
        },
      };
      let date = new Date(startDate).toISOString().split("T")[0];
      let dateArr = date?.split("-");
      let start_time = new Date(Number(dateArr[0]), Number(dateArr[1]) - 1, Number(dateArr[2]), 0, 0, 0, 0).toISOString()
      let end_time = new Date(Number(dateArr[0]), Number(dateArr[1]) - 1, Number(dateArr[2]), 23, 59, 0, 0).toISOString()
      getAvailability({
        trainer_id: trainerInfo?.userInfo?.trainer_id || selectedTrainer?.trainer_id,
        start_time: start_time,
        end_time: end_time
      }).then((res) => {
        setAvailableSlotsState(res?.data);
      })

      dispatch(checkSlotAsync(payload));
    }
  }, [selectedTrainer]);

  useEffect(() => {
    if (status === STATUS.fulfilled) {
      const bookingDate = Utils.getDateInFormatIOS(startDate);
      if (trainerInfo?.userInfo?.trainer_id || selectedTrainer?.trainer_id) {
        const payload = {
          trainer_id:
            trainerInfo?.userInfo?.trainer_id || selectedTrainer?.trainer_id,
          booked_date: bookingDate,
          slotTime: {
            from: timeRange.startTime
              ? timeRange.startTime
              : DefaultTimeRange.startTime,
            to: timeRange.endTime
              ? timeRange.endTime
              : DefaultTimeRange.endTime,
          },
        };

        let date = new Date(startDate).toISOString().split("T")[0];
        let dateArr = date?.split("-");
        let start_time = new Date(Number(dateArr[0]), Number(dateArr[1]) - 1, Number(dateArr[2]), 0, 0, 0, 0).toISOString()
        let end_time = new Date(Number(dateArr[0]), Number(dateArr[1]) - 1, Number(dateArr[2]), 23, 59, 0, 0).toISOString()
        getAvailability({
          trainer_id: trainerInfo?.userInfo?.trainer_id || selectedTrainer?.trainer_id,
          start_time: start_time,
          end_time: end_time
        }).then((res) => {
          setAvailableSlotsState(res?.data);
        })
        dispatch(checkSlotAsync(payload));
      }
    }
  }, [status]);

  const setTableData = (data = [], selectedDate) => {
    const result = data.map(
      ({
        available_slots,
        category,
        email,
        fullname,
        profilePicture,
        trainer_id,
        extraInfo,
        _id,
      }) => {
        const trainer_info = {
          category,
          email,
          fullname,
          profilePicture,
          trainer_id,
          extraInfo,
          _id,
        };
        return {
          trainer_info,
          monday: {
            date: selectedDate[0],
            trainer_info,
            slot: getSlotByDate(available_slots, weekDays[0]),
          },
          tuesday: {
            date: selectedDate[1],
            trainer_info,
            slot: getSlotByDate(available_slots, weekDays[1]),
          },
          wednesday: {
            date: selectedDate[2],
            trainer_info,
            slot: getSlotByDate(available_slots, weekDays[2]),
          },
          thursday: {
            date: selectedDate[3],
            trainer_info,
            slot: getSlotByDate(available_slots, weekDays[3]),
          },
          friday: {
            date: selectedDate[4],
            trainer_info,
            slot: getSlotByDate(available_slots, weekDays[4]),
          },
        };
      }
    );
    setBookingTableData(result);
  };

  const getSlotByDate = (slots = [], day) => {
    const slot =
      slots.find(
        (slot) => slot?.day && slot?.day?.toLowerCase() === day?.toLowerCase()
      ).slots || [];
    return slot
      .filter(({ start_time }) => start_time && start_time.length)
      .map(({ start_time, end_time }) => {
        return {
          start_time: getSpliitedTime(start_time),
          end_time: getSpliitedTime(end_time),
        };
      });
  };

  const getSpliitedTime = (time = "") => {
    const splittedTime = time.split(":");
    return `${splittedTime[0]}:${splittedTime[1]}`;
  };

  const setColumns = (weeks = []) => {
    setBookingColumns([]);
    const initialHeader = {
      title: "",
      dataIndex: "trainer_info",
      key: "Available_Trainers",
      width: 70,
      render: (
        { category, email, fullname, profilePicture, trainer_id, _id },
        record
      ) => {
        return (
          <div className="text-center">
            <img
              height={100}
              width={100}
              src={profilePicture}
              className="rounded"
            />
            <p htmlFor="exampleFormControlInput1" className="form-label mt-2">
              {fullname}
            </p>
          </div>
        );
      },
    };

    const weekCols = weeks.map((week, index) => {
      return {
        title: Utils.capitalizeFirstLetter(week),
        // a key using which we'll show records
        dataIndex: `${week.split(" ")[0].toLowerCase()}`,
        key: `week-col-${index}`,
        width: 100,
      };
    });

    setBookingColumns([initialHeader, ...weekCols]);
  };

  const Input = ({ onChange, placeholder, value, isSecure, id, onClick }) => (
    <span
      onChange={onChange}
      placeholder={placeholder}
      value={value}
      isSecure={isSecure}
      id={id}
      onClick={onClick}
      className="select_date"
    >
      {Utils.formateDate(startDate)}
    </span>
    
  );

  const renderSlotsByDay = ({ slot, date, trainer_info }) => {
    return slot.map((content, index) => (
      <Popover
        key={`popover${index}`}
        isOpen={
          `${trainer_info._id}_${index}-${date.toString()}` === isPopoverOpen
        }
        positions={["top"]} // if you'd like, you can limit the positions
        align={"center"}
        padding={5} // adjust padding here!
        reposition={true} // prevents automatic readjustment of content position that keeps your popover content within its parent's bounds
        onClickOutside={() => setIsPopoverOpen(null)} // handle click events outside of the popover/target here!
        content={(
          { position, nudgedLeft, nudgedTop } // you can also provide a render function that injects some useful stuff!
        ) => (
          <div key={`tablist-${index}`}>
            {/* <div style={{ zIndex: 5000 }} key={`tablist-${index}`}> */}
            <div className="alert alert-info m-20" role="alert">
              <p>
                Want to schedule a meeting with <b>{trainer_info.fullname}?</b>
              </p>
              <Nav tabs id="myTab1" role="tablist">
                <NavItem>
                  <NavLink
                    style={{ background: "white" }}
                    onClick={() => {
                      const amountPayable = Utils.getMinutesFromHourMM(
                        content.start_time,
                        content.end_time,
                        trainer_info?.extraInfo?.hourly_rate
                      );
                      if (amountPayable > 0) {
                        const payload = {
                          charging_price: amountPayable,
                          trainer_id: trainer_info.trainer_id,
                          trainer_info,
                          status: BookedSession.booked,
                          booked_date: date,
                          hourly_rate:
                            trainerInfo?.userInfo?.extraInfo?.hourly_rate ||
                            selectedTrainer?.data?.extraInfo?.hourly_rate,
                          session_start_time: content.start_time,
                          session_end_time: content.end_time,
                        };
                        setBookSessionPayload(payload);
                        dispatch(
                          createPaymentIntentAsync({
                            amount: +amountPayable.toFixed(1),
                          })
                        );
                      } else {
                        toast.error("Invalid slot timing...");
                      }
                    }}
                  >
                    Book slot now
                  </NavLink>
                </NavItem>
              </Nav>
            </div>
          </div>
        )}
      >
        <div
          onClick={() => {
            setIsPopoverOpen(`${trainer_info._id}_${index}-${date.toString()}`);
          }}
          key={`slot-${index}-content`}
          className="rounded-pill bg-primary text-white text-center p-1 mb-1 pointer font-weight-bold"
        >
          {Utils.convertToAmPm(content.start_time)} -{" "}
          {Utils.convertToAmPm(content.end_time)}{" "}
        </div>
      </Popover>
    ));
  };

  const renderTable = () => {
    return (
      <div
        className={`${trainerInfo?.userInfo
          ? "table-responsive-width"
          : "table-responsive-width"
          }`}
      >
        <table
          className={`${screenWidth <= 767 ? "table-responsive overflow-x-auto" : "table"
            } custom-trainer-slots-booking-table`}
        >
          <thead
            className="justify-center align-center table-thead"
            style={{
              borderBottom: screenWidth <= 767 ? "1px solid" : null,
            }}
          >
            <tr>
              {bookingColumns.map((columns, index) =>
                columns.title.length ? (
                  <th scope="col" key={`booking-col-${index}`}>
                    {columns.title}
                  </th>
                ) : null
              )}
            </tr>
          </thead>
          {bookingTableData && bookingTableData.length ? (
            <>
              {bookingTableData
                .filter(({ trainer_info }) => {
                  return (
                    trainer_info._id === trainerInfo?.userInfo?.id ||
                    trainer_info._id === selectedTrainer.id
                  );
                })
                .map(
                  ({ monday, tuesday, wednesday, thursday, friday }, index) => {
                    return (
                      <tr key={`table-data-${index}`}>
                        <td key={index}>
                          {monday.slot.length ? (
                            <div
                              style={{
                                width: screenWidth <= 767 ? "50vw" : null,
                              }}
                            >
                              {renderSlotsByDay(monday)}
                            </div>
                          ) : (
                            <div
                              key={`slot-${index}-content`}
                              style={{
                                width: screenWidth <= 767 ? "50vw" : null,
                              }}
                              className="rounded-pill border border-dark text-dark text-center p-1 mb-1 font-weight-bold"
                            >
                              {Message.noSlotsAvailable}
                            </div>
                          )}
                        </td>
                        <td>
                          {tuesday.slot.length ? (
                            <div
                              style={{
                                width: screenWidth <= 767 ? "50vw" : null,
                              }}
                            >
                              {renderSlotsByDay(tuesday)}
                            </div>
                          ) : (
                            <div
                              key={`slot-${index}-content`}
                              className="rounded-pill border border-dark text-dark text-center p-1 mb-1 font-weight-bold"
                              style={{
                                width: screenWidth <= 767 ? "50vw" : null,
                              }}
                            >
                              {Message.noSlotsAvailable}
                            </div>
                          )}
                        </td>
                        <td>
                          {wednesday.slot.length ? (
                            <div
                              style={{
                                width: screenWidth <= 767 ? "50vw" : null,
                              }}
                            >
                              {renderSlotsByDay(wednesday)}
                            </div>
                          ) : (
                            <div
                              key={`slot-${index}-content`}
                              className="rounded-pill border border-dark text-dark text-center p-1 mb-1 font-weight-bold"
                              style={{
                                width: screenWidth <= 767 ? "50vw" : null,
                              }}
                            >
                              {Message.noSlotsAvailable}
                            </div>
                          )}
                        </td>
                        <td>
                          {thursday.slot.length ? (
                            <div
                              style={{
                                width: screenWidth <= 767 ? "50vw" : null,
                              }}
                            >
                              {renderSlotsByDay(thursday)}
                            </div>
                          ) : (
                            <div
                              key={`slot-${index}-content`}
                              className="rounded-pill border border-dark text-dark text-center p-1 mb-1 font-weight-bold"
                              style={{
                                width: screenWidth <= 767 ? "50vw" : null,
                              }}
                            >
                              {Message.noSlotsAvailable}
                            </div>
                          )}
                        </td>
                        <td>
                          {friday.slot.length ? (
                            <div
                              style={{
                                width: screenWidth <= 767 ? "50vw" : null,
                              }}
                            >
                              {renderSlotsByDay(friday)}
                            </div>
                          ) : (
                            <div
                              key={`slot-${index}-content`}
                              className="rounded-pill border border-dark text-dark text-center p-1 mb-1 font-weight-bold"
                              style={{
                                width: screenWidth <= 767 ? "50vw" : null,
                              }}
                            >
                              {Message.noSlotsAvailable}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              <tr key={`table-data-empty`} className="table-last-row">
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </>
          ) : (
            <tr key={"no-data"} className="no-data">
              <td colSpan="6">No trainers available.</td>
            </tr>
          )}
        </table>
      </div>
    );
  };

  const renderPaymentContent = () => {
    return (
      <div>
        <h3>
          {" "}
          Trainer: {bookSessionPayload.trainer_info.fullname} (Price per hour $
          {bookSessionPayload?.trainer_info?.userInfo?.extraInfo?.hourly_rate ||
            TRAINER_AMOUNT_USD}
          ){" "}
        </h3>
        <h4 className="mt-3 mb-3">
          Booking time: {moment(bookSessionPayload?.booked_date).format("ll")} |
          From: {bookSessionPayload?.session_start_time} To:{" "}
          {bookSessionPayload?.session_end_time}
        </h4>
        <h4 className="mb-3">
          Price:
          <b>${bookSessionPayload?.charging_price}</b>
        </h4>
      </div>
    );
  };

  const renderStripePaymentContent = () =>
    transaction && transaction?.intent && transaction?.intent?.result ? (
      <div>
        <div className="d-flex justify-content-end mr-3">
          <h2
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={() => {
              setShowTransactionModal(false);
              dispatch(removePaymentIntent());
            }}
          >
            <X />
          </h2>
        </div>
        <div>
          {/* <h5>To book a slot, please pay {TRAINER_AMOUNT_USD}$.</h5> */}
          <div>
            <StripeCard
              clientSecret={transaction?.intent?.result?.client_secret}
              handlePaymentSuccess={async () => {
                setShowTransactionModal(false);
                const payload = {
                  ...bookSessionPayload,
                   payment_intent_id: transaction?.intent?.result?.id,
                   amount: (transaction?.intent?.result?.amount) / 100,
                   application_fee_amount: (transaction?.intent?.result?.application_fee_amount) / 100,
                  };
                var res = await dispatch(bookSessionAsync(payload));
                setIsPopoverOpen(null);
                setBookSessionPayload({});
                dispatch(authAction.setActiveTab("scheduleTraining"));
              }}
              extraContent={
                bookSessionPayload && bookSessionPayload.trainer_id ? (
                  renderPaymentContent()
                ) : (
                  <></>
                )
              }
              amount={bookSessionPayload?.charging_price ?? 0}
            />
          </div>
        </div>
      </div>
    ) : (
      <></>
    );


  const TogglTab = (value) => {
    if (value == "file") {
      dispatch(authAction?.setActiveModalTab(value));
      if (window.innerWidth > 1640 && document.querySelector(".chitchat-main")) {
        document
          .querySelector(".chitchat-main")
          .classList.remove("small-sidebar");
      }
    } else {
      dispatch(authAction.setActiveTab(value));
      if (
        window.innerWidth < 800 &&
        document &&
        document.querySelector &&
        document.querySelector(".app-sidebar")
      ) {
        document.querySelector(".app-sidebar").classList.remove("active");
      }
    }
  };
  const renderSearchMenu = () => (
    <div
      onScroll={() => {
        if (configs.sidebar.isMobileMode) {
          dispatch(isSidebarToggleEnabled(true));
        }
        return;
      }}
      className="bookings custom-scroll custom-trainee-dashboard booking-container"
    >

      <div className="row" >

        <div className="trainer-recommended"  >
          <h1 style={{ marginBottom: "10px" }}>Book Your Lesson now</h1>
          <p>Are you ready to embark on a transformative journey towards your personal and professional development? We are here to revolutionize the way you learn and connect with expert trainers. Our cutting-edge platform.</p>
        </div>
      </div>

      {popup && <PopupContent onClose={closePopup} userInfo={userInfo} Logout={Logout} />}

      <div
        id="dashboard"
        className="d-flex justify-content-center align-items-center dashboard-search-trainer"
        style={{ marginTop: "5%", marginBottom: "2%" }}
      >
        <SearchableDropdown
          placeholder="Search Trainers..."
          options={[...listOfTrainers, ...categoryList]}
          label="name"
          id="id"
          customClasses={{
            searchBar: "search-bar-trainee",
            searchButton: "search-button-trainee",
            dropdown: "custom-dropdown-width",
          }}
          onSearchClick={(query) => {
            if (query) {
              setTrainerInfo((prev) => ({
                ...prev,
                userInfo: null,
                selected_category: query,
              }));
            }
            setQuery(query);
          }}
          searchValue={(value) => {
            setParams({ search: value });
          }}
          selectedOption={(option) => {
            if (option && option.isCategory) {
              setTrainerInfo((prev) => ({
                ...prev,
                userInfo: option,
                selected_category: option.name,
              }));
            } else {
              setTrainerInfo((prev) => ({
                ...prev,
                userInfo: option,
                selected_category: null,
              }));
            }
          }}
          handleChange={(value) => {
            setParams({ search: value });
          }}
        />
      </div>
      <div className="trainer-recommended Slider" style={{ height: '90px' }}>
        <div className="row">
          <div className="col">
            <Slider {...settings}>
              {data?.category?.map((item, index) => (
                <div key={`slider-item-${index}`} >
                  <span
                    className="badge badge-light lg"
                    style={{
                      padding: "18px", // Add your desired padding here
                      alignItems: "center",
                      fontSize: "14px",
                      color: "black",
                      cursor: "pointer",
                      width: "80%",
                      height: "0",
                      display: "flex",
                      justifyContent: "center", // Center content horizontally
                      flexDirection: "column",
                    }}
                    onClick={() => {
                      setTrainerInfo((prev) => ({
                        ...prev,
                        userInfo: {
                          id: item,
                          isCategory: true,
                          name: item,
                        },
                        selected_category: item,
                      }));
                      setParams({ search: item })
                    }}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </Slider>
          </div>
        </div>
      </div>

      <div className="trainer-recommended REC">
        <h2>Recommended</h2>
        <div className="Recommended" style={{ display: "flex", flexDirection: "row" }}>
          <TrainerSlider list={trainers} isRecommended={true} />
          <div className='card trainer-profile-card Home-main-Cont' style={{ height: "100%", width: "100%", maxWidth: '300px', margin: 'auto' }}>
            <div className='card-body'>
              <ShareClipsCard />
            </div>
          </div>
        </div>
      </div>
      <div style={{ height: "11vh" }} />
    </div >
  );

  const renderUserDetails = () => {
    return (
      <TrainerDetails
        selectOption={trainerInfo}
        isPopoverOpen={isPopoverOpen}
        categoryList={categoryList}
        key={`trainerDetails`}
        searchQuery={query}
        trainerInfo={trainerInfo?.userInfo}
        selectTrainer={(_id, trainer_id, data) => {
          if (_id) {
            setSelectedTrainer({
              ...selectedTrainer,
              id: _id,
              trainer_id,
              data,
            });
          }
          setTrainerInfo((pre => {
            return {
              ...pre,
              userInfo: {
                ...pre?.userInfo,
                ...data
              }
            }
          }))
        }}
        onClose={() => {
          setTrainerInfo((prev) => ({
            ...prev,
            userInfo: undefined,
            selected_category: undefined,
          }));
          setParams((prev) => ({
            ...prev,
            search: null,
          }));
        }}
        element={renderBookingTable()}
      />
    );
  };

  const renderCategoryTrainerDetails = () => {
    return <CategoryTrainerDetails />;
  };

  const renderBookingTable = () => {
    const { data: { extraInfo } = {}, trainer_id } = selectedTrainer || {};
    const { from, to } = extraInfo?.working_hours || {};
    const fromHours = from ? Utils.getTimeFormate(from) : null;
    const toHours = to ? Utils.getTimeFormate(to) : null;
    const formateStartTime = Utils.getTimeFormate(trainerInfo?.userInfo?.extraInfo?.working_hours?.from);
    const formateEndTime = Utils.getTimeFormate(trainerInfo?.userInfo?.extraInfo?.working_hours?.to);

    return (
      <React.Fragment>
        <div className="row">
          <div className="col-12 mb-3 d-flex ml-n3 ">
            <label className="mr-2 mt-2 ml-3" style={{ fontSize: "14px" }}>
              Select date :{" "}
            </label>
            <div className="date-picker">
              <DatePicker
                style={{
                  fontSize: "14px",
                }}
                className="mt-1"
                minDate={moment().toDate()}
                onChange={(date) => {
                  console.log("datedatedatedatedate", date)
                  if (date) {
                    const booked_date = Utils.getDateInFormatIOS(date);
                    const payload = {
                      trainer_id:
                        trainerInfo?.userInfo?.trainer_id ||
                        selectedTrainer?.trainer_id,
                      booked_date,
                      slotTime: {
                        from:
                          formateStartTime ||
                          timeRange.startTime ||
                          DefaultTimeRange.startTime,
                        to:
                          formateEndTime ||
                          timeRange.endTime ||
                          DefaultTimeRange.endTime,
                      },
                    };
                    dispatch(checkSlotAsync(payload));
                    setStartDate(date);

                    date = new Date(date).toISOString().split("T")[0];
                    let dateArr = date?.split("-");
                    let start_time = new Date(Number(dateArr[0]), Number(dateArr[1]) - 1, Number(dateArr[2]), 0, 0, 0, 0).toISOString()
                    let end_time = new Date(Number(dateArr[0]), Number(dateArr[1]) - 1, Number(dateArr[2]), 23, 59, 0, 0).toISOString()
                    getAvailability({
                      trainer_id: trainerInfo?.userInfo?.trainer_id || selectedTrainer?.trainer_id,
                      start_time: start_time,
                      end_time: end_time
                    }).then((res) => {
                      setAvailableSlotsState(res?.data);
                    })
                  }
                  const todaySDate = Utils.getDateInFormat(date.toString());
                  const { weekDateFormatted, weekDates } =
                    Utils.getNext7WorkingDays(todaySDate);
                  setColumns(weekDateFormatted);
                  // setTableData(getTraineeSlots, weekDates);
                  setColumns(weekDateFormatted);
                }}
                selected={startDate}
                customInput={<Input />}
                dateFormat="MM-dd-yyyy"
              />
            </div>
          </div>
          <div className="col-11">
            {(getParams.search && getParams.search.length) ||
              !bookingColumns.length ? (
              <div className="row">
                <label className="mt-1 ml-3" style={{ fontSize: "13px" }}>
                  Select Slot :{" "}
                </label>
                {/* <div className="col-12 col-sm-12 col-md-11 col-lg-12 col-xl-8 col-xxl-8 mt-1 mb-2 ml-2 ">
                  <CustomRangePicker
                    availableSlots={
                      availableSlots
                        ? availableSlots
                        : []
                    }
                    startTime={
                      trainerInfo?.userInfo?.extraInfo?.working_hours?.from
                        ? Utils.convertHoursToMinutes(formateStartTime)
                        : TimeRange.start
                    }
                    endTime={
                      trainerInfo?.userInfo?.extraInfo?.working_hours?.to
                        ? Utils.convertHoursToMinutes(formateEndTime)
                        : TimeRange.end
                    }
                    trainerHourlyRate={
                      trainerInfo?.userInfo?.extraInfo?.working_hours
                    }
                    onChange={(time) => {
                      const startTime = time.startTime;
                      const endTime = time.endTime;
                      if (startTime && endTime) {
                        const payload = {
                          booked_date: startDate,
                          trainer_id:
                            trainerInfo?.userInfo?.trainer_id ||
                            selectedTrainer?.trainer_id,
                          slotTime: { from: startTime, to: endTime },
                        };
                        setTimeRange({ ...timeRange, startTime, endTime });
                        const debouncedAPI = debounce(() => {
                          // dispatch(checkSlotAsync(payload));
                        }, debouncedConfigs.towSec);
                        debouncedAPI();
                      }
                      // if (!isSlotAvailable) {
                      //   toast.error(Message.notAvailable, { type: "error" });
                      // }
                    }}
                    isSlotAvailable={isSlotAvailable}
                    key={"time-range-slider"}
                  />
                </div>
                <div className="col-12 mb-3 d-flex justify-content-center align-items-center">
                  <button
                    type="button"
                    disabled={Utils.isTimeRangeAvailable(availableSlots, timeRange.startTime, timeRange.endTime)}
                    className="mt-3 btn btn-sm btn-primary"
                    onClick={() => {
                      const amountPayable = Utils.getMinutesFromHourMM(
                        timeRange.startTime,
                        timeRange.endTime,
                        trainerInfo?.userInfo?.extraInfo?.hourly_rate
                      );
                      if (amountPayable > 0) {
                        if (
                          Utils.isValidTimeDuration(
                            timeRange.startTime,
                            timeRange.endTime,
                            minimumMeetingDurationInMin
                          )
                        ) {
                          if (
                            Utils.isInRange(
                              startDate,
                              timeRange.startTime,
                              timeRange.endTime
                            )
                          ) {
                            toast.error(
                              "The specified time has elapsed. Please select another time..."
                            );
                          } else {
                            const payload = {
                              charging_price: amountPayable,
                              trainer_id:
                                trainerInfo?.userInfo?.trainer_id ||
                                selectedTrainer?.trainer_id,
                              trainer_info: trainerInfo || selectedTrainer.data,
                              hourly_rate:
                                trainerInfo?.userInfo?.extraInfo?.hourly_rate ||
                                selectedTrainer?.data?.extraInfo?.hourly_rate,
                              status: BookedSession.booked,
                              booked_date: startDate,
                              session_start_time: timeRange.startTime,
                              session_end_time: timeRange.endTime,
                            };
                            setBookSessionPayload(payload);
                            dispatch(
                              createPaymentIntentAsync({
                                amount: +amountPayable.toFixed(1),
                              })
                            );
                          }
                        } else {
                          toast.error(
                            `Session duration must be greater then ${minimumMeetingDurationInMin} minutes...`
                          );
                        }
                      } else {
                        toast.error("Invalid slot timing...");
                      }
                    }}
                  >
                    Book Slot Now
                  </button>
                </div> */}

                {/* Book slot by given slot and time */}
                <div className="row" style={{ display: "flex", width: "100%", justifyContent: "space-between", margin: "0px 10px", textAlign: "center" }}>
                  {availableSlotsState?.length ?
                    <> {
                      availableSlotsState?.map((item, i) => {
                        return <div onClick={() => {
                          if (!item?.status) {
                            var temp = availableSlotsState?.map(slt => {
                              return { ...slt, isSelected: false }
                            })
                            temp[i].isSelected = true
                            setAvailableSlotsState([...temp])
                          }
                        }} className="col-6" style={{
                          border:
                            item?.status
                              ? "2px solid grey" :
                              item?.isSelected ? "2px solid green"
                                : "1px solid",
                          cursor: "pointer",
                          padding: "10px 0px"
                        }}>
                          <b style={{ color: item?.status ? "grey" : "#000080" }}>{moment(item?.start_time).format('h:mm a')} - {moment(item?.end_time).format('h:mm a')}</b>
                        </div>
                      })}
                      <div className="col-12 mb-3 d-flex justify-content-center align-items-center">
                        <button
                          type="button"
                          disabled={!availableSlotsState?.find(slt => slt?.isSelected)}
                          className="mt-3 btn btn-sm btn-primary"
                          onClick={() => {
                            var slot = availableSlotsState?.find(slt => slt?.isSelected)

                            var start_time = `${new Date(slot?.start_time).getHours().toString().padStart(2, '0')}:${new Date(slot?.start_time).getMinutes().toString().padStart(2, '0')}`
                            var end_time = `${new Date(slot?.end_time).getHours().toString().padStart(2, '0')}:${new Date(slot?.end_time).getMinutes().toString().padStart(2, '0')}`

                            const amountPayable = Utils.getMinutesFromHourMM(
                              start_time,
                              end_time,
                              trainerInfo?.userInfo?.extraInfo?.hourly_rate
                            );
                            if (amountPayable > 0) {
                              if (
                                Utils.isInRange(
                                  startDate,
                                  start_time,
                                  end_time
                                )
                              ) {
                                toast.error(
                                  "The specified time has elapsed. Please select another time..."
                                );
                              } else {
                                const payload = {
                                  slot_id: slot?._id,
                                  charging_price: amountPayable,
                                  trainer_id:
                                    trainerInfo?.userInfo?.trainer_id ||
                                    selectedTrainer?.trainer_id,
                                  trainer_info: trainerInfo || selectedTrainer.data,
                                  hourly_rate:
                                    trainerInfo?.userInfo?.extraInfo?.hourly_rate ||
                                    selectedTrainer?.data?.extraInfo?.hourly_rate,
                                  status: BookedSession.booked,
                                  booked_date: startDate,
                                  session_start_time: start_time,
                                  session_end_time: end_time,
                                  start_time: slot?.start_time,
                                  end_time: slot?.end_time,
                                };
                                setBookSessionPayload(payload);
                                dispatch(
                                  createPaymentIntentAsync({
                                    amount: +amountPayable.toFixed(1),
                                    destination: trainerInfo?.userInfo?.stripe_account_id,
                                    commission: trainerInfo?.userInfo?.commission,
                                    customer: userInfo?.stripe_account_id,
                                  })
                                );
                              }
                            }
                          }}
                        >
                          Book Slot Now
                        </button>
                      </div>
                    </>
                    : <div className="mt-1 ml-3" style={{ fontSize: "13px" }}>
                      <span>
                        Trainer is not available.
                      </span>
                    </div>}
                </div>


                {/* Book Slot time range bar  */}

                {/* <label className="mt-1 ml-3" style={{ fontSize: "13px" }}>
                  Session Duration :{" "}
                </label>
                <div className="col-12 col-sm-12 col-md-11 col-lg-12 col-xl-8 col-xxl-8 mt-1 mb-2 ml-2 ">
                  <CustomRangePicker
                    availableSlots={
                      availableSlots
                        ? availableSlots
                        : [
                          {
                            start_time: "",
                            end_time: "",
                          },
                        ]
                    }
                    startTime={
                      trainerInfo?.userInfo?.extraInfo?.working_hours?.from
                        ? Utils.convertHoursToMinutes(formateStartTime)
                        : TimeRange.start
                    }
                    endTime={
                      trainerInfo?.userInfo?.extraInfo?.working_hours?.to
                        ? Utils.convertHoursToMinutes(formateEndTime)
                        : TimeRange.end
                    }
                    trainerHourlyRate={
                      trainerInfo?.userInfo?.extraInfo?.working_hours
                    }
                    onChange={(time) => {
                      const startTime = time.startTime;
                      const endTime = time.endTime;
                      if (startTime && endTime) {
                        const payload = {
                          booked_date: startDate,
                          trainer_id:
                            trainerInfo?.userInfo?.trainer_id ||
                            selectedTrainer?.trainer_id,
                          slotTime: { from: startTime, to: endTime },
                        };
                        setTimeRange({ ...timeRange, startTime, endTime });
                        const debouncedAPI = debounce(() => {
                          // dispatch(checkSlotAsync(payload));
                        }, debouncedConfigs.towSec);
                        debouncedAPI();
                      }
                      // if (!isSlotAvailable) {
                      //   toast.error(Message.notAvailable, { type: "error" });
                      // }
                    }}
                    isSlotAvailable={isSlotAvailable}
                    key={"time-range-slider"}
                  />
                </div>
                <div className="col-12 mb-3 d-flex justify-content-center align-items-center">
                  <button
                    type="button"
                    disabled={
                      !Utils.isTimeRangeAvailableForRangeBarBtn(
                        availableSlots,
                        timeRange.startTime,
                        timeRange.endTime || status === STATUS.pending
                      )
                    }
                    className="mt-3 btn btn-sm btn-primary"
                    onClick={() => {
                      const amountPayable = Utils.getMinutesFromHourMM(
                        timeRange.startTime,
                        timeRange.endTime,
                        trainerInfo?.userInfo?.extraInfo?.hourly_rate
                      );
                      if (amountPayable > 0) {
                        if (
                          Utils.isValidTimeDuration(
                            timeRange.startTime,
                            timeRange.endTime,
                            minimumMeetingDurationInMin
                          )
                        ) {
                          if (
                            Utils.isInRange(
                              startDate,
                              timeRange.startTime,
                              timeRange.endTime
                            )
                          ) {
                            toast.error(
                              "The specified time has elapsed. Please select another time..."
                            );
                          } else {
                            var date = new Date(startDate).toISOString().split("T")[0];
                            var dateArr = date?.split("-");
                            let start_time_date = new Date(Number(dateArr[0]), Number(dateArr[1]) - 1, Number(dateArr[2]), Number(timeRange?.startTime?.split(":")[0]), Number(timeRange?.startTime?.split(":")[1]), 0, 0)?.toISOString()
                            let end_time_date = new Date(Number(dateArr[0]), Number(dateArr[1]) - 1, Number(dateArr[2]), Number(timeRange?.endTime?.split(":")[0]), Number(timeRange?.endTime?.split(":")[1]), 0, 0)?.toISOString()

                            const payload = {
                              charging_price: amountPayable,
                              trainer_id:
                                trainerInfo?.userInfo?.trainer_id ||
                                selectedTrainer?.trainer_id,
                              trainer_info: trainerInfo || selectedTrainer.data,
                              hourly_rate:
                                trainerInfo?.userInfo?.extraInfo?.hourly_rate ||
                                selectedTrainer?.data?.extraInfo?.hourly_rate,
                              status: BookedSession.booked,
                              booked_date: startDate,
                              session_start_time: timeRange.startTime,
                              session_end_time: timeRange.endTime,
                              start_time: start_time_date,
                              end_time: end_time_date,
                            };
                            setBookSessionPayload(payload);
                            dispatch(
                              createPaymentIntentAsync({
                                amount: +amountPayable.toFixed(1),
                              })
                            );
                          }
                        } else {
                          toast.error(
                            `Session duration must be greater then ${minimumMeetingDurationInMin} minutes...`
                          );
                        }
                      } else {
                        toast.error("Invalid slot timing...");
                      }
                    }}
                  >
                    Book Slot Now
                  </button>
                </div> */}
              </div>
            ) : (
              <TrainerSlider list={listOfTrainers} />
            )}
          </div>
        </div>
        <Modal
          isOpen={showTransactionModal}
          element={renderStripePaymentContent()}
        />
        {/* <div className="row">
        <div className="mt-4 col-1.4 datePicker">
          <DatePicker
            minDate={moment().toDate()}
            onChange={(date) => {
              setStartDate(date);
              const todaySDate = Utils.getDateInFormat(date.toString());
              const { weekDateFormatted, weekDates } =
                Utils.getNext7WorkingDays(todaySDate);
              setColumns(weekDateFormatted);
              setTableData(getTraineeSlots, weekDates);
              setColumns(weekDateFormatted);
            }}
            selected={startDate}
            // ref={null}
            customInput={<Input />}
          />
        </div>
      </div>
      <div className="row">
        <div className="col-8 pt-3">
          {(getParams.search && getParams.search.length) ||
          !bookingColumns.length ? (
            renderTable()
          ) : (
            <TrainerSlider list={listOfTrainers} />
          )}
        </div>
      </div> */}
      </React.Fragment>
    );
  };

  return (
    // <div>
    //   {/* <div className="m-25 header">
    //   <h3 className="fs-1 p-3 mb-2 bg-primary text-white rounded">
    //     Book Training Session
    //   </h3>
    // </div>

    // <div
    //   className={`form-inline search-form open mb-5`}
    //   style={{
    //     width: "92vw",
    //     height: "4rem",
    //     marginTop: "60px",
    //     marginLeft: "6rem",
    //   }}
    // >
    //   <div className="form-group">
    //     <input
    //       className="form-control-plaintext"
    //       type="search"
    //       value={getParams.search}
    //       placeholder="Search..."
    //       onChange={(event) => {
    //         const { value } = event.target;
    //         setParams({ search: value });
    //       }}
    //     />
    //   </div>
    //   <div className="mt-3 ml-1 datePicker">
    //     <DatePicker
    //       minDate={moment().toDate()}
    //       onChange={(date) => {
    //         setStartDate(date);
    //         const todaySDate = Utils.getDateInFormat(date.toString());
    //         const { weekDateFormatted, weekDates } =
    //           Utils.getNext7WorkingDays(todaySDate);
    //         setColumns(weekDateFormatted);
    //         setTableData(getTraineeSlots, weekDates);
    //         setColumns(weekDateFormatted);
    //       }}
    //       selected={startDate}
    //       // ref={null}
    //       customInput={<Input />}
    //     />
    //   </div>
    // </div> */}
    //   {/* <div className="pt-5" style={{ marginTop: "7rem" }}>
    //   <div className="ml-4 ">
    //     {(getParams.search && getParams.search.length) ||
    //     !bookingColumns.length ? (
    //       renderTable()
    //     ) : (
    //       <TrainerSlider list={listOfTrainers} />
    //     )}
    //   </div>
    // </div> */}
    //   {/* <Modal isOpen={showTransactionModal} element={renderStripePaymentContent()} /> */}
    //   {/* {renderSearchMenu()}
    // <div className="trainer-slider p02">
    //   <h2>Available Trainers...</h2>
    //   <TrainerSlider list={listOfTrainers} />
    // </div> */}
    //   {trainerInfo && trainerInfo.userInfo ? (
    //     renderUserDetails()
    //   ) : (
    //     <div>
    //       {renderSearchMenu()}
    //       <div className="trainer-slider p02">
    //         <h2>Recommended</h2>
    //         <TrainerSlider list={listOfTrainers} />
    //       </div>
    //     </div>
    //   )}
    // </div>
    <React.Fragment>
      {trainerInfo.userInfo === null ||
        (trainerInfo && trainerInfo.userInfo) ? (
        <div className="custom-scroll">{renderUserDetails()}</div>
      ) : (
        <div className="custom-scroll trainee-dashboard">
          {renderSearchMenu()}
        </div>
      )}
    </React.Fragment>
  );
};

export default ScheduleTraining;
