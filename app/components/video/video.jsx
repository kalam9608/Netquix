"use client";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { EVENTS } from "../../../helpers/events";
import { SocketContext } from "../socket";
import { Popover } from "react-tiny-popover";
import _debounce from "lodash/debounce";
import { Tooltip } from "react-tippy";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import {
  MicOff,
  PauseCircle,
  Phone,
  PlayCircle,
  ExternalLink,
  Play,
  Pause,
  Aperture,
  FilePlus,
  X,
  Trash2,
  Crop,
  Video,
  VideoOff,
} from "react-feather";
import { AccountType, SHAPES } from "../../common/constants";
import { CanvasMenuBar } from "./canvas.menubar";
import { toast } from "react-toastify";
import { max, set } from "lodash";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import html2canvas from "html2canvas";
import CustomModal from "../../common/modal";
import CropImage from "./cropimage";
import jsPDF from "jspdf";
import { getS3SignPdfUrl } from "./video.api";
import axios from "axios";
import {
  createReport,
  cropImage,
  getReport,
  getS3SignUrl,
  getSaveSessionS3SignUrl,
  removeImage,
  screenShotTake,
} from "../videoupload/videoupload.api";
import ReportModal from "./reportModal";
import { Utils } from "../../../utils/utils";
import { awsS3Url } from "../../../utils/constant";
import ScreenShotDetails from "./screenshotDetails";
import { FaLock, FaUnlock } from "react-icons/fa";

let storedLocalDrawPaths = { sender: [], receiver: [] };
let selectedShape = null;
let canvasConfigs = {
  sender: {
    strokeStyle: "red",
    lineWidth: 5,
    lineCap: "round",
  },
  receiver: {
    strokeStyle: "green",
    lineWidth: 5,
    lineCap: "round",
  },
};

// default setup;
let isDrawing = false;
let savedPos;
let startPos;
let currPos;
let strikes = [];
let extraStream;
let localVideoRef;
let Peer;
export const HandleVideoCall = ({
  id,
  accountType,
  fromUser,
  toUser,
  isClose,
  session_end_time,
  bIndex,
}) => {
  function getInitials(fullName) {
    // Split the full name into separate words
    const nameParts = fullName.split(" ");

    // Check if there are at least two words (first and last name)
    if (nameParts.length < 2) {
      return "Invalid name format";
    }

    // Get the first letter of the first name and the last letter of the last name
    const firstNameInitial = nameParts[0][0].toUpperCase();
    const lastNameInitial =
      nameParts[nameParts.length - 1][
        nameParts[nameParts.length - 1].length - 1
      ].toUpperCase();

    // Combine and return the initials
    return firstNameInitial + lastNameInitial;
  }

  // const dispatch = useAppDispatch();
  const socket = useContext(SocketContext);
  const [sketchPickerColor, setSketchPickerColor] = useState({
    r: 241,
    g: 112,
    b: 19,
    a: 1,
  });

  const [remoteStream, setRemoteStream] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const ffmpegRef = useRef(new FFmpeg());

  const [isMuted, setIsMuted] = useState(false);
  const [isFeedStopped, setIsFeedStopped] = useState(false);
  const [displayMsg, setDisplayMsg] = useState({ showMsg: false, msg: "" });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const state = {
    mousedown: false,
  };
  const [selectedClips, setSelectedClips] = useState([]);

  const selectedVideoRef1 = useRef(null);
  const selectedVideoRef2 = useRef(null);
  const progressBarRef = useRef(null);
  const progressBarRef2 = useRef(null);
  const globalProgressBarRef = useRef(0);
  const [progressRange, setProgressRange] = useState(0);
  const [isRemoteVideoOff, setRemoteVideoOff] = useState(false);
  const [isPlaying, setIsPlaying] = useState({
    isPlayingAll: false,
    number: "",
    isPlaying1: false,
    isPlaying2: false,
  });
  const [videoTime, setVideoTime] = useState({
    currentTime1: "00:00",
    currentTime2: "00:00",
    remainingTime1: "00:00",
    remainingTime2: "00:00",
  });
  const [maxMin, setMaxMin] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenConfirm, setIsOpenConfirm] = useState(false);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const [isOpenReport, setIsOpenReport] = useState(false);
  const [isOpenCrop, setIsOpenCrop] = useState(false);
  const [screenShots, setScreenShots] = useState([]);
  const [reportObj, setReportObj] = useState({ title: "", topic: "" });
  const [reportArr, setReportArr] = useState([]);
  const [selectImage, setSelectImage] = useState(0);
  const [volume, setVolume] = useState(1);
  const [volume2, setVolume2] = useState(1);

  const volumeInputRef = useRef(null);
  const volumeInputRef2 = useRef(null);

  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  // const [screenStream, setScreenStream] = useState(null);

  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [timeDifference, setTimeDifference] = useState("");
  const [screenStream, setScreenStream] = useState(null);

  const [isCallEnded, setIsCallEnded] = useState(false);
  const [micStream, setMicStream] = useState(null);

  const [isModelOpen, setIsModelOpen] = useState(false);
  const [isScreenShotModelOpen, setIsScreenShotModelOpen] = useState(false);

  const [isPinned, setIsPinned] = useState(false);
  const [pinnedUser, setPinnedUser] = useState(null);
  const [videoController, setVideoController] = useState(false);
  console.log("=======> progressBarRef", {
    videoRef,
    selectedVideoRef1,
    remoteVideoRef,
    selectedVideoRef2,
  });

  useEffect(() => {
    if (screenStream) {
      screenStream.getVideoTracks().forEach((track) => {
        track.stop();
      });
    }
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.stop();
      });
    }
    if (micStream) {
      micStream.getAudioTracks().forEach((track) => {
        track.stop();
      });
    }
    stopRecording();
  }, [isCallEnded]);

  useEffect(() => {
    const updateTimerDifference = () => {
      const now = new Date();
      const [endHours, endMinutes] = session_end_time
        .split(":")
        .map((num) => parseInt(num));
      const endTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        endHours,
        endMinutes
      );

      let timeDifference;
      let isOver = false;

      if (now < endTime) {
        const timeUntilTimeout = endTime.getTime() - now.getTime();

        const hoursDiff = Math.floor(timeUntilTimeout / (1000 * 60 * 60));
        const minutesDiff = Math.floor(
          (timeUntilTimeout % (1000 * 60 * 60)) / (1000 * 60)
        );
        const secondsDiff = Math.floor((timeUntilTimeout % (1000 * 60)) / 1000);

        const paddedHours = pad(Math.abs(hoursDiff));
        const paddedMinutes = pad(Math.abs(minutesDiff));
        const paddedSeconds = pad(Math.abs(secondsDiff));

        timeDifference = `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
      } else {
        const timeSinceTimeout = now.getTime() - endTime.getTime();

        const hoursDiff = Math.floor(timeSinceTimeout / (1000 * 60 * 60));
        const minutesDiff = Math.floor(
          (timeSinceTimeout % (1000 * 60 * 60)) / (1000 * 60)
        );
        const secondsDiff = Math.floor((timeSinceTimeout % (1000 * 60)) / 1000);

        const paddedHours = pad(Math.abs(hoursDiff));
        const paddedMinutes = pad(Math.abs(minutesDiff));
        const paddedSeconds = pad(Math.abs(secondsDiff));

        timeDifference = `-${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
        isOver = true;
      }

      setTimeDifference(timeDifference);
      // setIsOverTime(isOver);
    };

    const pad = (num) => {
      return num < 10 ? `0${num}` : num;
    };

    // Update timer difference every second
    const intervalId = setInterval(updateTimerDifference, 1000);

    // Initial call to update immediately
    updateTimerDifference();

    // Clean up interval
    return () => clearInterval(intervalId);
  }, [session_end_time]);

  const handleOffline = () => {
    stopRecording();
    socket.emit("chunksCompleted");
  };
  useEffect(() => {
    console.log(`fromUser && toUser --- `, fromUser, toUser);
    if (fromUser && toUser) {
      if (typeof navigator !== "undefined") {
        Peer = require("peerjs").default;
      }
      handleStartCall();
      listenSocketEvents();
      initializeLocalStates();
      window.addEventListener("offline", handleOffline);

      window.addEventListener("beforeunload", handelTabClose);

      return () => {
        window.removeEventListener("beforeunload", handelTabClose);
        window.removeEventListener("offline", handleOffline);
        cutCall();
      };
    }
  }, []);

  // const setupAudioMixing = async () => {
  //   const audioContext = new AudioContext();

  //   const localAudioTrack = localStream.getAudioTracks();

  //   // Assuming webRtcStream is defined and available
  //   const webRtcAudioTrack = remoteStream.getAudioTracks()[0];

  //   const micSource = audioContext.createMediaStreamSource(
  //     new MediaStream([localAudioTrack])
  //   );
  //   const webRtcSource = audioContext.createMediaStreamSource(
  //     new MediaStream([webRtcAudioTrack])
  //   );
  //   const destination = audioContext.createMediaStreamDestination();

  //   micSource.connect(destination);
  //   webRtcSource.connect(destination);

  //   return destination.stream;
  // };
  //2nd method
  // const setupAudioMixing = async () => {
  //   const audioContext = new AudioContext();

  //   // Get the local audio track from the localStream
  //   // const localAudioTrack = localStream.getAudioTracks()[0];
  //   //mix with mic audio track
  //   const localAudioStream = await navigator.mediaDevices.getUserMedia({
  //     audio: true,
  //   });
  //   setMicStream(localAudioStream);
  //   const localAudioTrack = localAudioStream.getAudioTracks()[0];

  //   // Get the remote audio track from the remoteStream
  //   const remoteAudioTrack = remoteStream.getAudioTracks()[0];

  //   // Create audio nodes for the local and remote audio tracks
  //   const localSource = audioContext.createMediaStreamSource(
  //     new MediaStream([localAudioTrack])
  //   );
  //   const remoteSource = audioContext.createMediaStreamSource(
  //     new MediaStream([remoteAudioTrack])
  //   );

  //   // Create a destination node for the mixed audio
  //   const destination = audioContext.createMediaStreamDestination();

  //   // Connect the local and remote audio sources to the destination
  //   localSource.connect(destination);
  //   remoteSource.connect(destination);

  //   // Return the mixed audio stream from the destination
  //   return destination.stream;
  // };

  const setupAudioMixing = async () => {
    const audioContext = new AudioContext();

    // Get the local audio track from the localStream
    const localAudioStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    setMicStream(localAudioStream); // Assuming setMicStream is a function defined elsewhere
    const localAudioTrack = localAudioStream.getAudioTracks()[0];

    // Check if remoteStream exists and has audio tracks before accessing
    let remoteAudioTrack;
    if (remoteStream && remoteStream.getAudioTracks().length > 0) {
      remoteAudioTrack = remoteStream.getAudioTracks()[0];
    } else {
      // Handle the case where remoteStream is null or has no audio tracks
      // This might involve logging an error, setting a default track, or some other fallback
      console.error("remoteStream is null or has no audio tracks.");
      // Optionally, return or continue with additional logic here
      // For example, you might want to only process local audio if remote audio is unavailable
    }

    // Create audio nodes for the local audio track. If remoteAudioTrack is undefined,
    // skip creating or connecting the remote source to avoid errors.
    const localSource = audioContext.createMediaStreamSource(
      new MediaStream([localAudioTrack])
    );
    const destination = audioContext.createMediaStreamDestination();
    localSource.connect(destination);

    if (remoteAudioTrack) {
      // Create and connect the audio node for the remote audio track only if it exists
      const remoteSource = audioContext.createMediaStreamSource(
        new MediaStream([remoteAudioTrack])
      );
      remoteSource.connect(destination);
    }

    // Return the mixed audio stream from the destination
    return destination.stream;
  };

  const handelTabClose = async () => {
    mediaRecorder?.stop();
    setRecording(false);
    socket.emit("chunksCompleted");
  };

  const startRecording = async () => {
    setRecording(true);

    const data = {
      sessions: id,
      trainer: toUser?._id,
      trainee: fromUser?._id,
      user_id: fromUser?._id,
      trainee_name: fromUser?.fullname,
      trainer_name: toUser?.fullname,
    };

    socket.emit("videoUploadData", data);

    const mixedAudioStream = await setupAudioMixing();

    const screenStr = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      preferCurrentTab: true,
    });
    setScreenStream(screenStr);

    const screenVideoTrack = screenStr.getVideoTracks()[0];

    const combinedStream = new MediaStream([
      screenVideoTrack,
      ...mixedAudioStream.getAudioTracks(),
    ]);

    const mediaRecorder = new MediaRecorder(combinedStream);

    let chunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    setInterval(function () {
      // Check if the MediaRecorder is recording
      if (mediaRecorder.state === "recording") {
        // Request data if available
        mediaRecorder.requestData();

        const chunkBuffers = chunks
          .map((chunk) => {
            // Assuming chunk is already a Buffer or Uint8Array, no conversion needed
            if (chunk) {
              console.log("Chunk type:", typeof chunk);
              return chunk;
            } else {
              // Handle invalid chunk data here
              console.log("Invalid chunk data:", chunk);
              return null; // or handle differently as needed
            }
          })
          .filter(Boolean); // Remove null entries

        // Send only if there are valid chunkBuffers
        if (chunkBuffers.length > 0) {
          const chunkData = { data: chunkBuffers };
          socket.emit("chunk", chunkData);
          // Handle the recorded data here (in chunks array)
          console.log("Data:", chunkBuffers);
        } else {
          console.log("No valid chunks to send");
        }

        // Clear chunks array for next interval
        chunks = [];
      }
    }, 1000);

    mediaRecorder.onstop = () => {
      // const blob = new Blob(chunks, { type: "video/webm" });
      // const url = URL.createObjectURL(blob);
      // const a = document.createElement("a");
      // document.body.appendChild(a);
      // a.style = "display: none";
      // a.href = url;
      // a.download = `${Date.now()}.webm`;
      // a.click();
      // window.URL.revokeObjectURL(url);
      socket.emit("chunksCompleted");
    };

    mediaRecorder.start();
    setMediaRecorder(mediaRecorder);
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
    }
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!context) return;

    const drawFrame = () => {
      if (canvas && context && video) {
        //   context.drawImage(video, 0, 0, canvas.width, canvas.height);
        context.fillStyle = "rgba(255, 255, 255, 0.5)";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      requestAnimationFrame(drawFrame);
    };

    const startDrawing = (event) => {
      event.preventDefault();
      isDrawing = true;
      if (!context) return;
      savedPos = context?.getImageData(
        0,
        0,
        document.getElementById("bookings")?.clientWidth,
        document.getElementById("bookings")?.clientHeight
      );
      if (strikes.length >= 10) strikes.shift(); // removing first position if strikes > 10;
      strikes.push(savedPos);
      const mousePos = getMosuePositionOnCanvas(event);
      context.strokeStyle = canvasConfigs.sender.strokeStyle;
      context.lineWidth = canvasConfigs.sender.lineWidth;
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(mousePos.x, mousePos.y);
      context.fill();
      state.mousedown = true;
      startPos = { x: mousePos.x, y: mousePos.y };
    };

    const findDistance = () => {
      let dis = Math.sqrt(
        Math.pow(currPos.x - startPos.x, 2) +
          Math.pow(currPos.y - startPos.y, 2)
      );
      return dis;
    };

    const drawShapes = () => {
      switch (selectedShape) {
        case SHAPES.LINE: {
          context.moveTo(startPos.x, startPos.y);
          context.lineTo(currPos.x, currPos.y);
          break;
        }
        case SHAPES.CIRCLE: {
          let distance = findDistance(startPos, currPos);
          context.arc(startPos.x, startPos.y, distance, 0, 2 * Math.PI, false);
          break;
        }
        case SHAPES.SQUARE: {
          let w = currPos.x - startPos.x;
          let h = currPos.y - startPos.y;
          context.rect(startPos.x, startPos.y, w, h);
          break;
        }
        case SHAPES.RECTANGLE: {
          let w = currPos.x - startPos.x;
          let h = currPos.y - startPos.y;
          context.rect(startPos.x, startPos.y, w, h);
          break;
        }
        case SHAPES.OVAL: {
          const transform = context.getTransform();
          let w = currPos.x - startPos.x;
          let h = currPos.y - startPos.y;
          context.fillStyle = "#FFFFFF";
          context.fillStyle = "rgba(0, 0, 0, 0)";
          const radiusX = w * transform.a;
          const radiusY = h * transform.d;
          if (radiusX > 0 && radiusY > 0) {
            context.ellipse(
              currPos.x,
              currPos.y,
              radiusX,
              radiusY,
              0,
              0,
              2 * Math.PI
            );
            context.fill();
          }
          break;
        }
        case SHAPES.TRIANGLE: {
          context.moveTo(startPos.x + (currPos.x - startPos.x) / 2, startPos.y);
          context.lineTo(startPos.x, currPos.y);
          context.lineTo(currPos.x, currPos.y);
          context.closePath();
          break;
        }
        case SHAPES.ARROW_RIGHT: {
          const arrowSize = 10;
          const direction = Math.atan2(
            currPos.y - startPos.y,
            currPos.x - startPos.x
          );
          // Calculate the coordinates of the arrowhead
          const arrowheadX = currPos.x + length * Math.cos(direction);
          const arrowheadY = currPos.y + length * Math.sin(direction);
          // Draw the line of the arrow
          context.moveTo(startPos.x, startPos.y);
          context.lineTo(currPos.x, currPos.y);
          // Draw the arrowhead
          context.moveTo(arrowheadX, arrowheadY);
          context.lineTo(
            currPos.x - arrowSize * Math.cos(direction - Math.PI / 6),
            currPos.y - arrowSize * Math.sin(direction - Math.PI / 6)
          );
          context.moveTo(currPos.x, currPos.y);
          context.lineTo(
            currPos.x - arrowSize * Math.cos(direction + Math.PI / 6),
            currPos.y - arrowSize * Math.sin(direction + Math.PI / 6)
          );
          context.stroke();
          break;
        }
        case SHAPES.TWO_SIDE_ARROW: {
          const x1 = startPos.x;
          const y1 = startPos.y;
          const x2 = currPos.x;
          const y2 = currPos.y;
          const size = 10;
          const angle = Math.atan2(y2 - y1, x2 - x1);
          const arrowPoints = [
            {
              x: x2 - size * Math.cos(angle - Math.PI / 6),
              y: y2 - size * Math.sin(angle - Math.PI / 6),
            },
            {
              x: x2 - size * Math.cos(angle + Math.PI / 6),
              y: y2 - size * Math.sin(angle + Math.PI / 6),
            },
            {
              x: x1 + size * Math.cos(angle - Math.PI / 6),
              y: y1 + size * Math.sin(angle - Math.PI / 6),
            },
            {
              x: x1 + size * Math.cos(angle + Math.PI / 6),
              y: y1 + size * Math.sin(angle + Math.PI / 6),
            },
          ];
          context.moveTo(x1, y1);
          context.lineTo(x2, y2);
          context.moveTo(arrowPoints[0].x, arrowPoints[0].y);
          context.lineTo(x2, y2);
          context.lineTo(arrowPoints[1].x, arrowPoints[1].y);
          context.moveTo(arrowPoints[2].x, arrowPoints[2].y);
          context.lineTo(x1, y1);
          context.lineTo(arrowPoints[3].x, arrowPoints[3].y);

          context.stroke();
          break;
        }
      }
    };

    const draw = (event) => {
      event.preventDefault();
      if (!isDrawing || !context || !state.mousedown) return;
      const mousePos = getMosuePositionOnCanvas(event);
      currPos = { x: mousePos?.x, y: mousePos.y };

      if (selectedShape) {
        context.putImageData(savedPos, 0, 0);
        context.beginPath();
        drawShapes();
        context.stroke();
      } else {
        console.log(`--- drawing ---- `);
        context.strokeStyle = canvasConfigs.sender.strokeStyle;
        context.lineWidth = canvasConfigs.sender.lineWidth;
        context.lineCap = "round";
        context.lineTo(mousePos.x, mousePos.y);
        context.stroke();
      }
    };

    const stopDrawing = (event) => {
      event.preventDefault();
      if (state.mousedown) {
        console.log(`--- stop drawing ---- `);
        sendStopDrawingEvent();
        isDrawing = false;
        state.mousedown = false;
        sendDrawEvent();
      }
    };

    // allowing trainer to draw
    if (canvas && accountType === AccountType.TRAINER) {
      // for mobile
      canvas.addEventListener("touchstart", startDrawing);
      canvas.addEventListener("touchmove", draw);
      canvas.addEventListener("touchend", stopDrawing);
      // for web
      canvas.addEventListener("mousedown", startDrawing);
      canvas.addEventListener("mousemove", draw);
      canvas.addEventListener("mouseup", stopDrawing);
      // canvas.addEventListener("mouseout", stopDrawing);
    }

    return () => {
      video?.removeEventListener("play", drawFrame);
      cutCall();
    };
  }, [canvasRef]);

  useMemo(() => {
    if (
      remoteVideoRef.current &&
      remoteStream &&
      !remoteVideoRef.current.srcObject
    ) {
      remoteVideoRef.current.srcObject = remoteStream;
      accountType === AccountType.TRAINEE ? setIsModelOpen(true) : null;
    }

    return () => {
      cutCall();
    };
  }, [remoteStream]);

  useEffect(() => {
    if (
      remoteStream &&
      remoteVideoRef.current &&
      !remoteVideoRef.current.srcObject
    ) {
      remoteVideoRef.current.srcObject = remoteStream;
      accountType === AccountType.TRAINEE ? setIsModelOpen(true) : null;
    }
  }, [remoteStream]);

  const initializeLocalStates = () => {
    strikes = [];
    localVideoRef = null;
    selectedShape = null;
  };

  const cutCall = () => {
    console.log(`--- cut call --- `);
    stopRecording();
    cleanupFunction();
    isClose();
    // if (remoteVideoRef && remoteVideoRef.current) {
    //   socket.emit(EVENTS.VIDEO_CALL.ON_CLOSE, {
    //     userInfo: { from_user: fromUser._id, to_user: toUser._id },
    //   });
    // }
  };

  const listenSocketEvents = () => {
    // once user joins the call
    socket.on("ON_CALL_JOIN", ({ userInfo }) => {
      console.log(
        ` end user join --- `,
        userInfo,
        peerRef.current,
        fromUser,
        toUser
      );
      const { to_user, from_user } = userInfo;
      if (!(peerRef && peerRef.current)) return;
      connectToPeer(peerRef.current, from_user);
    });

    // Handle signaling events from the signaling server
    socket.on(EVENTS.VIDEO_CALL.ON_OFFER, (offer) => {
      console.log(` -- on OFFER --`);
      peerRef.current?.signal(offer);
    });

    socket.on(EVENTS.VIDEO_CALL.ON_ANSWER, (answer) => {
      console.log(` -- on answer --`);
      peerRef.current?.signal(answer);
    });

    socket.on(EVENTS.VIDEO_CALL.ON_ICE_CANDIDATE, (candidate) => {
      console.log(` -- on ICE candidate --`);
      peerRef.current?.signal(candidate);
    });

    socket.on(EVENTS.ON_CLEAR_CANVAS, () => {
      clearCanvas();
    });

    // socket.on(EVENTS.VIDEO_CALL.MUTE_ME, ({ muteStatus }) => {
    //   if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
    //     remoteVideoRef.current.srcObject.getAudioTracks()[0].enabled =
    //       muteStatus;
    //   }
    // });

    socket.on(EVENTS.VIDEO_CALL.STOP_FEED, ({ feedStatus }) => {
      setRemoteVideoOff(feedStatus);
      console.log(
        feedStatus ,"setRemoteVideoOff"
      );
      // if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      //   remoteVideoRef.current.srcObject.getVideoTracks()[0].enabled =
      //     feedStatus;
      //   console.log("====================================");
      //   console.log(feedStatus, "feedStatus");
      //   console.log("====================================");
      //   setRemoteVideoOff(feedStatus);
      // } else {
      //   // remoteVideoRef.current.srcObject.getVideoTracks()[0].enabled = feedStatus;
      // }
    });

    socket.on(EVENTS.EMIT_DRAWING_CORDS, ({ strikes }) => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!context || !canvas) return;
      const blob = new Blob([strikes]);
      const image = new Image();
      image.src = URL.createObjectURL(blob);
      image.onload = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0);
      };
    });

    socket.on(EVENTS.ON_UNDO, ({ sender, receiver }) => {
      storedLocalDrawPaths.receiver = [];
      storedLocalDrawPaths.sender = [];
      storedLocalDrawPaths.sender = receiver;
      storedLocalDrawPaths.receiver = sender;
      undoDrawing(
        { coordinates: sender, theme: canvasConfigs.receiver },
        {
          coordinates: receiver,
          theme: {
            lineWidth: canvasConfigs.sender.lineWidth,
            strokeStyle: canvasConfigs.sender.strokeStyle,
          },
        },
        false
      );
    });

    socket.on(EVENTS.VIDEO_CALL.ON_CLOSE, () => {
      setDisplayMsg({
        showMsg: true,
        msg: `${toUser?.fullname} left the meeting, redirecting back to home screen in 5 seconds...`,
      });
      cleanupFunction();
    });
  };

  const getMosuePositionOnCanvas = (event) => {
    const canvas = canvasRef.current;
    var rect = canvas.getBoundingClientRect();
    var x = event?.clientX - rect?.left;
    var y = event?.clientY - rect?.top;
    return {
      x: x || 0,
      y: y || 0,
    };

    // if (
    //   event.clientX ||
    //   event.clientY ||
    //   (event?.touches && event?.touches[0])
    // ) {
    //   const clientX = event?.clientX || event?.touches[0]?.clientX;
    //   const clientY = event?.clientY || event?.touches[0]?.clientY;
    //   const { offsetLeft, offsetTop } = event.target;
    //   const canvasX = clientX - (offsetLeft || (mediaQuery.matches ? 100 : 50));
    //   const canvasY = clientY - offsetTop;
    // }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!context || !canvas) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleStartCall = () => {
    // console.clear();
    console.log(`--- handleStartCall ---`);
    const startVideoCall = async () => {
      try {
        const stream = await navigator.mediaDevices
          .getUserMedia({
            video: true,
            audio: true,
          })
          .catch((err) => {
            toast.error(
              "Please allow media permission to microphone and camera for video call..."
            );
            console.log(`unable to access video call ---- `, err);
          });
        setLocalStream(stream);
        setDisplayMsg({
          showMsg: true,
          msg: `Waiting for ${toUser?.fullname}  to join...`,
        });

        videoRef.current.srcObject = stream;
        // setLocalVideoRef(stream);
        // localVideoRef = { srcObject: stream };
        const peer = new Peer(fromUser._id, {
          config: {
            iceServers: [
              {
                username: "netqwixSTURN",
                credential: "testing@123",
                url: "turn:turn.netqwix.com",
              },
            ],
          },
        });
        peerRef.current = peer;
        peer.on("open", (id) => {
          socket.emit("ON_CALL_JOIN", {
            userInfo: { from_user: fromUser._id, to_user: toUser._id },
          });
          console.log("My peer ID is: " + id);
        });
        peer.on("error", (error) => {
          console.error(`error ---`, error);
        });

        // Handle incoming voice/video connection
        peer.on("call", (call) => {
          console.log(`incoming call ----`);
          call.answer(stream); // Answer the call with an A/V stream.
          call.on("stream", (remoteStream) => {
            setDisplayMsg({ showMsg: false, msg: "" });
            console.log(
              `onCall: setting remoteStream here for initially connected user ---- `
            );
            setRemoteStream(remoteStream);
          });
        });
      } catch (error) {
        toast.error(
          "Please allow media permission to microphone and camera for video call..."
        );
        console.error("Error accessing media devices:", error);
      }
    };
    startVideoCall().then(() => {});
  };

  // Initiate outgoing connection
  let connectToPeer = (peer, peerId) => {
    console.log(`Connecting to ${peerId}...`);

    // let conn = peer.connect(peerId);
    // conn.on('data', (data) => {
    //     console.log(`received: ${data}`);
    // });
    // conn.on('open', () => {
    //     conn.send('hi!');
    // });

    // navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    // .then((stream) => {
    if (!(videoRef && videoRef?.current)) return;
    let call = peer.call(peerId, videoRef?.current?.srcObject);
    call.on("stream", (remoteStream) => {
      console.log(`setting remoteStream for 2nd user here ---- `);
      setDisplayMsg({ showMsg: false, msg: "" });
      remoteVideoRef.current.srcObject = remoteStream;
      setRemoteStream(remoteStream);
      accountType === AccountType.TRAINEE ? setIsModelOpen(true) : null;
    });
    // })
    // .catch((err) => {
    //     console.log('Failed to get local stream', err);
    // });
  };

  const sendDrawEvent = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (!(event && event.target)) return;
        const binaryData = event.target.result;
        console.log(`emit draw event---`);
        socket.emit(EVENTS.DRAW, {
          userInfo: { from_user: fromUser._id, to_user: toUser._id },
          // storedEvents,
          // canvasConfigs,
          strikes: binaryData,
        });
      };
      reader.readAsArrayBuffer(blob);
    });
  };

  const sendStopDrawingEvent = () => {
    if (remoteVideoRef && remoteVideoRef.current) {
      socket.emit(EVENTS.STOP_DRAWING, {
        userInfo: { from_user: fromUser._id, to_user: toUser._id },
      });
    }
  };

  const sendClearCanvasEvent = () => {
    if (remoteVideoRef && remoteVideoRef.current) {
      socket.emit(EVENTS.EMIT_CLEAR_CANVAS, {
        userInfo: { from_user: fromUser._id, to_user: toUser._id },
      });
    }
  };

  function handlePeerDisconnect() {
    stopRecording();
    if (!(peerRef && peerRef.current)) return;
    console.log(
      `peerRef.current.connections --- `,
      peerRef.current.connections
    );

    // manually close the peer connections
    for (let conns in peerRef.current.connections) {
      peerRef.current.connections[conns].forEach((conn, index, array) => {
        console.log(
          `closing ${conn.connectionId} peerConnection (${index + 1}/${
            array.length
          })`,
          conn.peerConnection
        );
        conn.peerConnection.close();

        // close it using peerjs methods
        if (conn.close) conn.close();
      });
    }
  }

  const cleanupFunction = () => {
    handlePeerDisconnect();

    console.log("====================================");
    console.log(
      "cleanupFunction",
      localStream,
      screenStream,
      remoteStream,
      localVideoRef?.current,
      remoteVideoRef?.current
    );
    console.log("====================================");

    setIsCallEnded(true);

    if (localStream) {
      localStream.getAudioTracks().forEach(function (track) {
        track.stop();
      });
      setLocalStream(null);
    }
    if (screenStream) {
      screenStream.getAudioTracks().forEach(function (track) {
        track.stop();
      });
      setScreenStream(null);
    }

    if (remoteStream) {
      remoteStream.getAudioTracks().forEach(function (track) {
        track.stop();
      });
      setRemoteStream(null);
    }
    let videorefSrc = videoRef.current || localVideoRef;
    if (videoRef && videorefSrc && videorefSrc.srcObject) {
      videorefSrc.srcObject.getTracks().forEach((t) => {
        t.stop();
      });

      videorefSrc.srcObject.getVideoTracks().forEach((t) => {
        t.stop();
      });
    }

    let videorefSrcRemote = remoteVideoRef.current;
    if (remoteVideoRef && videorefSrcRemote && videorefSrcRemote.srcObject) {
      videorefSrcRemote.srcObject.getTracks().forEach((t) => {
        t.stop();
      });
      videorefSrcRemote.srcObject.getVideoTracks().forEach((t) => {
        t.stop();
      });
    }

    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    clearCanvas();
  };

  const sendEmitUndoEvent = useCallback(_debounce(sendDrawEvent, 500), []);

  const undoDrawing = async (
    senderConfig,
    extraCoordinateConfig,
    removeLastCoordinate = true
  ) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!context || !canvas) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (removeLastCoordinate) storedLocalDrawPaths.sender.splice(-1, 1);
    // draw all the paths in the paths array
    await senderConfig.coordinates.forEach((path) => {
      context.beginPath();
      context.strokeStyle = senderConfig.theme.strokeStyle;
      context.lineWidth = senderConfig.theme.lineWidth;
      context.lineCap = "round";
      if (path && Array.isArray(path)) {
        // context.
        context.moveTo(path[0][0], path[0][1]);
        for (let i = 0; i < path.length; i++) {
          context.lineTo(path[i][0], path[i][1]);
        }
        context.stroke();
      }
    });

    await extraCoordinateConfig.coordinates.forEach((path) => {
      context.beginPath();
      context.strokeStyle = extraCoordinateConfig.theme.strokeStyle;
      context.lineWidth = extraCoordinateConfig.theme.lineWidth;
      context.lineCap = "round";

      // context.beginPath();
      if (path && Array.isArray(path)) {
        // context.
        context.moveTo(path[0][0], path[0][1]);
        for (let i = 0; i < path.length; i++) {
          context.lineTo(path[i][0], path[i][1]);
        }
        context.stroke();
      }
    });

    if (strikes.length <= 0) return;
    context.putImageData(strikes[strikes.length - 1], 0, 0);
    strikes.pop();

    // sending event to end user
    if (removeLastCoordinate) {
      // socket.emit(EVENTS.EMIT_UNDO, {
      //     sender: storedLocalDrawPaths.sender,
      //     receiver: extraCoordinateConfig.coordinates,
      //     userInfo: { from_user: fromUser._id, to_user: toUser._id },
      // });
      sendEmitUndoEvent();
    }
  };

  const getReportData = async () => {
    var res = await getReport({
      sessions: id,
      trainer: fromUser?._id,
      trainee: toUser?._id,
    });
    console.log(res, "set screenshot data for session");
    setScreenShots(res?.data?.reportData);
    setReportObj({ title: res?.data?.title, topic: res?.data?.description });
  };

  const showReportData = async () => {
    // getReportData()
    setIsOpenReport(true);
  };

  function captureVideo1() {
    let canvas = document.getElementById("video-canvas-1"); // declare a canvas element in your html
    let ctx = canvas.getContext("2d");
    let w, h;
    const v = document.getElementById("selected-video-1");
    try {
      w = v.videoWidth;
      h = v.videoHeight;
      canvas.width = w;
      canvas.height = h;
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(v, 0, 0, w, h);
      const a = canvas.toDataURL();
      v.style.backgroundImage = `url(${a})`;
      v.style.backgroundSize = "cover";
      ctx.clearRect(0, 0, w, h); // clean the canvas
      return true;
    } catch (e) {
      console.log(e);
    }
  }

  function captureVideo2() {
    let canvas = document.getElementById("video-canvas-2"); // declare a canvas element in your html
    let ctx = canvas.getContext("2d");
    let w, h;
    const v = document.getElementById("selected-video-2");
    try {
      w = v.videoWidth;
      h = v.videoHeight;
      canvas.width = w;
      canvas.height = h;
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(v, 0, 0, w, h);
      const a = canvas.toDataURL();
      v.style.backgroundImage = `url(${a})`;
      v.style.backgroundSize = "cover";
      ctx.clearRect(0, 0, w, h); // clean the canvas
      return true;
    } catch (e) {
      console.log(e);
    }
  }

  const takeScreenshot = () => {
    // if (selectedClips?.length) {
    //   captureVideo1();
    //   captureVideo2();
    // }
    setIsScreenShotModelOpen(false);
    if (selectedClips?.length) {
      if (selectedClips.length === 1) captureVideo1();
      else if (selectedClips.length === 2) {
        captureVideo1();
        captureVideo2();
      }
    }

    const targetElement = document.body;
    // let targetElement;
    // let hideElements = false;
    // if (selectedClips?.length) {
    //   // If clips are selected, use element with id 'third'
    //   targetElement = document.getElementById('third');
    //   hideElements = true;
    // } else {
    //   // If no clips selected, use document.body
    //   targetElement = document.body;
    // }
    const creationBarItem = document.querySelector(".creationBarItem");
    const callActionButtons = document.querySelector(".call-action-buttons");
    const mainNav = document.querySelector(".main-nav");
    const Pause = document.querySelector(".Pause");
    const Pause2 = document.querySelector(".Pause2");
    const progress1 = document.querySelector(".progress1");
    const progress2 = document.querySelector(".progress2");
    // const scs = document.querySelector('.scs');
    // const scs2 = document.querySelector('.scs2');

    const userVideo1 = document.getElementById("user-video-1");
    const userVideo2 = document.getElementById("user-video-2");
    const ChevronLeft = document.getElementById("ChevronLeft");
    const ChevronRight = document.getElementById("ChevronRight");

    if (ChevronLeft) {
      ChevronLeft.style.transition = "opacity 1s";
      ChevronLeft.style.opacity = "0";
      ChevronLeft.style.background = "#fff";
    }
    if (ChevronRight) {
      ChevronRight.style.transition = "opacity 1s";
      ChevronRight.style.opacity = "0";
      ChevronRight.style.background = "#fff";
    }

    if (Pause) {
      Pause.style.transition = "opacity 1s";
      Pause.style.opacity = "0";
    }
    if (progress1) {
      progress1.style.transition = "opacity 1s";
      progress1.style.opacity = "0";
    }
    if (Pause2) {
      Pause2.style.transition = "opacity 1s";
      Pause2.style.opacity = "0";
    }
    if (progress2) {
      progress2.style.transition = "opacity 1s";
      progress2.style.opacity = "0";
    }
    if (userVideo1 && selectedClips?.length) {
      userVideo1.style.transition = "opacity 1s";
      userVideo1.style.opacity = "0";
    }
    if (userVideo2 && selectedClips?.length) {
      userVideo2.style.transition = "opacity 1s";
      userVideo2.style.opacity = "0";
    }

    // Hide elements with a smooth transition
    if (creationBarItem) {
      creationBarItem.style.transition = "opacity 1s"; // Adjust the duration based on your needs
      creationBarItem.style.opacity = "0";
    }

    if (callActionButtons) {
      callActionButtons.style.transition = "opacity 1s"; // Adjust the duration based on your needs
      callActionButtons.style.opacity = "0";
    }
    if (mainNav) {
      mainNav.style.transition = "opacity 1s"; // Set duration to 0s
      mainNav.style.opacity = "0";
    }

    // if(Pause){
    //   Pause.style.transition = 'opacity 1s'
    //   Pause.style.opacity = '0';
    // }
    // if(progress1){
    //   progress1.style.transition = 'opacity 1s'
    //   progress1.style.opacity = '0';
    // }
    // if(Pause2){
    //   Pause2.style.transition = 'opacity 1s'
    //   Pause2.style.opacity = '0';
    // }
    // if(progress2){
    //   progress2.style.transition = 'opacity 1s'
    //   progress2.style.opacity = '0';
    // }
    // if(scs){
    //   scs.style.transition = 'opacity 1s'
    //   scs.style.opacity = '0';
    // }
    // if(scs2){
    //   scs2.style.transition = 'opacity 1s'
    //   scs2.style.opacity = '0';
    // }

    html2canvas(targetElement, { type: "png" }).then(async (canvas) => {
      // document.body.appendChild(canvas);
      const dataUrl = canvas.toDataURL("image/png");
      // screenShots.push({
      //   title: "",
      //   description: "",
      //   imageUrl: dataUrl
      // })
      // setScreenShots([...screenShots])
      if (creationBarItem) {
        creationBarItem.style.transition = "opacity 1s";
        creationBarItem.style.opacity = "1";
      }

      if (callActionButtons) {
        callActionButtons.style.transition = "opacity 1s";
        callActionButtons.style.opacity = "1";
      }
      if (mainNav) {
        mainNav.style.transition = "opacity 1s"; // Adjust the duration based on your needs
        mainNav.style.opacity = "1";
      }
      if (Pause) {
        Pause.style.transition = "opacity 1s";
        Pause.style.opacity = "1";
      }
      if (progress1) {
        progress1.style.transition = "opacity 1s";
        progress1.style.opacity = "1";
      }
      if (Pause2) {
        Pause2.style.transition = "opacity 1s";
        Pause2.style.opacity = "1";
      }
      if (progress2) {
        progress2.style.transition = "opacity 1s";
        progress2.style.opacity = "1";
      }
      if (userVideo1 && selectedClips?.length) {
        userVideo1.style.transition = "opacity 1s";
        userVideo1.style.opacity = "1";
      }
      if (userVideo2 && selectedClips?.length) {
        userVideo2.style.transition = "opacity 1s";
        userVideo2.style.opacity = "1";
      }

      if (ChevronLeft) {
        ChevronLeft.style.transition = "opacity 1s";
        ChevronLeft.style.opacity = "1";
        ChevronLeft.style.background = "#000080";
      }
      if (ChevronRight) {
        ChevronRight.style.transition = "opacity 1s";
        ChevronRight.style.opacity = "1";
        ChevronRight.style.background = "#000080";
      }
      // if(scs){
      //   scs.style.transition = 'opacity 1s'
      //   scs.style.opacity = '1';
      // }
      // if(scs2){
      //   scs2.style.transition = 'opacity 1s'
      //   scs2.style.opacity = '1';
      // }

      var res = await screenShotTake({
        sessions: id,
        trainer: fromUser?._id,
        trainee: toUser?._id,
      });
      const blob = await fetch(dataUrl).then((res) => {
        res.blob();
      });
      if (res?.data?.url) {
        var res = await getReport({
          sessions: id,
          trainer: fromUser?._id,
          trainee: toUser?._id,
        });
        console.log(res, "set screenshot data for session");
        setScreenShots(res?.data?.reportData);
        setIsScreenShotModelOpen(true);
        pushProfilePhotoToS3(res?.data?.url, blob);
      }

      setTimeout(() => {
        // Success message after the screenshot is successfully taken and processed
        toast.success("The screenshot taken successfully.", {
          type: "success",
        });
      }, 2000);

      // const link = document.createElement('a');
      // link.href = dataUrl;
      // link.download = 'screenshot.png';
      // document.body.appendChild(link);
      // link.click();
      // document.body.removeChild(link);
    });
  };

  async function pushProfilePhotoToS3(presignedUrl, uploadPhoto) {
    const myHeaders = new Headers({ "Content-Type": "image/*" });
    await axios.put(presignedUrl, uploadPhoto, {
      headers: myHeaders,
    });

    const v = document.getElementById("selected-video-1");
    if (v) v.style.backgroundImage = "";
    const v2 = document.getElementById("selected-video-2");
    if (v2) v2.style.backgroundImage = "";
    return true;
  }

  const uploadVideoToS3Bucket = async (blob) => {
    const formData = new FormData();
    formData.append("file", blob);
    formData.append("upload_preset", "video_upload");
    const response = await axios.post(
      "https://api.cloudinary.com/v1_1/dq7bq9j3d/video/upload",
      formData
    );
    return response.data.secure_url;
  };

  const mediaQuery = window.matchMedia(
    "(min-width: 768px) and (min-width: 1024px)"
  );

  const renderCallActionButtons = () => {
    console.log("code:0.0.2" + session_end_time);
    return (
      <div className="call-action-buttons z-50 my-3 ">
        <Tooltip
          title={isMuted ? "Unmute" : "Mute"}
          position="bottom"
          trigger="mouseenter"
        >
          <div
            className={`icon-btn ${isMuted ? "btn-danger" : "btn-light"} ${
              mediaQuery.matches ? "btn-xl" : "btn-sm"
            } button-effect mic`}
            onClick={() => {
              // if (remoteVideoRef && remoteVideoRef.current) {
              //   socket.emit(EVENTS.VIDEO_CALL.MUTE_ME, {
              //     userInfo: { from_user: fromUser._id, to_user: toUser._id },
              //     isClicked: !isMuted,
              //   });
              //   setIsMuted(!isMuted);
              // }

              if (localStream) {
                const audioTracks = localStream.getAudioTracks();
                if (audioTracks.length > 0) {
                  audioTracks[0].enabled = !audioTracks[0].enabled;
                  setIsMuted(!audioTracks[0].enabled);
                }
              }
              if (micStream) {
                const audioTracks = micStream.getAudioTracks();
                if (audioTracks.length > 0) {
                  audioTracks[0].enabled = !audioTracks[0].enabled;
                  setIsMuted(!audioTracks[0].enabled);
                }
              }
            }}
          >
            <MicOff />
          </div>
        </Tooltip>
        <Tooltip
          title={isFeedStopped ? "Video Play" : "Video Pause"}
          position="bottom"
          trigger="mouseenter"
        >
          <div
            className={`icon-btn btn-light  button-effect ${
              mediaQuery.matches ? "btn-xl" : "btn-sm"
            } ml-3`}
            onClick={() => {
              if (localStream) {
                localStream.getVideoTracks().forEach((track) => {
                  track.enabled = !track.enabled; // Toggle camera state
                });
                socket.emit(EVENTS.VIDEO_CALL.STOP_FEED, {
                  userInfo: { from_user: fromUser._id, to_user: toUser._id },
                  feedStatus: !isFeedStopped,
                });
                setIsFeedStopped(!isFeedStopped);
              }

              // if (videoRef.current && videoRef.current.srcObject) {
              //   const availableTracks = videoRef.current.srcObject.getTracks();
              //   const availableVideoTracks =
              //     videoRef.current.srcObject.getVideoTracks();
              //   for (
              //     let videoRefIndex = 0;
              //     videoRefIndex < availableTracks.length;
              //     videoRefIndex++
              //   ) {
              //     const track = availableTracks[videoRefIndex];
              //     track.enabled = isFeedStopped;
              //   }

              //   for (
              //     let videoRefIndex = 0;
              //     videoRefIndex < availableVideoTracks.length;
              //     videoRefIndex++
              //   ) {
              //     const track = availableVideoTracks[videoRefIndex];
              //     track.enabled = isFeedStopped;
              //   }
              // }
              // if (remoteVideoRef && remoteVideoRef.current) {
              //   socket.emit(EVENTS.VIDEO_CALL.STOP_FEED, {
              //     userInfo: { from_user: fromUser._id, to_user: toUser._id },
              //     feedStatus: isFeedStopped,
              //   });
              // }
            }}
          >
            {!isFeedStopped ? <PauseCircle /> : <PlayCircle />}
          </div>
        </Tooltip>

        <Tooltip title={"End Call"} position="bottom" trigger="mouseenter">
          <div
            className={`icon-btn btn-danger button-effect ${
              mediaQuery.matches ? "btn-xl" : "btn-sm"
            }  ml-3`}
            onClick={() => {
              cutCall();
            }}
          >
            <Phone />
          </div>
        </Tooltip>

        {!displayMsg?.showMsg && accountType === AccountType.TRAINER && (
          <Tooltip
            title={selectedClips.length ? "Exit clip analysis mode" : "Clip analysis mode"}
            position="bottom"
            trigger="mouseenter"
          >
            <div
              className={
                !maxMin
                  ? `icon-btn btn-light  button-effect  ${
                      mediaQuery.matches ? "btn-xl" : "btn-sm"
                    }  ml-3`
                  : `icon-btn btn-danger  button-effect  ${
                      mediaQuery.matches ? "btn-xl" : "btn-sm"
                    }  ml-3`
              }
              onClick={() => {
                // socket.emit(EVENTS.ON_VIDEO_SHOW, {
                //   userInfo: { from_user: fromUser._id, to_user: toUser._id },
                //   isClicked: !maxMin,
                // });
                // setMaxMin(!maxMin)
                if (selectedClips?.length) {
                  setIsOpenConfirm(true);
                } else {
                  setIsOpen(true);
                }
              }}
            >
              <ExternalLink />
            </div>
          </Tooltip>
        )}

        {selectedClips?.length && accountType === AccountType.TRAINER ? (
          <Tooltip
            title={videoController ? 'Lock' : 'Unlock'}
            position="bottom"
            trigger="mouseenter"
          >
            <div
              className={`icon-btn btn-light  button-effect ${
                mediaQuery.matches ? "btn-xl" : "btn-sm"
              } ml-3`}
              onClick={globalProgressBarToggler}
            >
              {/* {isPlaying?.isPlayingAll ? <PauseCircle /> : <PlayCircle />} */}
              {videoController ? <FaLock /> : <FaUnlock />}
            </div>
          </Tooltip>
        ) : (
          <></>
        )}

        {accountType === AccountType.TRAINER ? (
          <Tooltip title={"Screenshot"} position="bottom" trigger="mouseenter">
            <div
              className={`icon-btn btn-light  button-effect ${
                mediaQuery.matches ? "btn-xl" : "btn-sm"
              } ml-3`}
              onClick={() => {
                takeScreenshot();
              }}
            >
              <Aperture />
            </div>
          </Tooltip>
        ) : (
          <></>
        )}

        {accountType === AccountType.TRAINER ? (
          <Tooltip title={"Game Plans"} position="bottom" trigger="mouseenter">
            <div
              className={`icon-btn btn-light  button-effect ${
                mediaQuery.matches ? "btn-xl" : "btn-sm"
              } ml-3`}
              onClick={showReportData}
            >
              <FilePlus />
            </div>
          </Tooltip>
        ) : (
          <></>
        )}

        {/* {accountType === AccountType.TRAINEE ? (
          <div
            className={`icon-btn btn-light  button-effect ${mediaQuery.matches ? "btn-xl" : "btn-sm"
              } ml-3`}
            onClick={recording ? stopRecording : startRecording}
          >
            {recording ? <VideoOff /> : <Video />}
          </div>
        ) : (
          <></>
        )} */}

        <Modal
          isOpen={isOpenConfirm}
          toggle={() => {
            setIsOpenConfirm(false);
          }}
        >
          <ModalHeader
            toggle={() => {
              setIsOpenConfirm(false);
            }}
            close={() => <></>}
          >
            Confirm
          </ModalHeader>
          <ModalBody>
            Are you sure you want to exit clip analysis mode?
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              onClick={() => {
                setSelectedClips([]);
                setIsOpenConfirm(false);
              }}
            >
              Confirm
            </Button>{" "}
            <Button
              color="secondary"
              onClick={() => {
                setIsOpenConfirm(false);
              }}
            >
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  };


// NOTE - separate funtion for emit
const emitVideoSelectEvent = (type, videos, mainScreen) => {
    socket.emit(EVENTS.ON_VIDEO_SELECT, {
        userInfo: { from_user: fromUser._id, to_user: toUser._id },
        type,
        videos,
        mainScreen,
    });
};

  useEffect(() => {
    // socket.emit(EVENTS.ON_VIDEO_SELECT, {
    //   userInfo: { from_user: fromUser._id, to_user: toUser._id },
    //   videos: selectedClips,
    // });
    emitVideoSelectEvent('clips' , selectedClips , pinnedUser)
  }, [selectedClips?.length]);

  
  socket.on(
    EVENTS.ON_VIDEO_PLAY_PAUSE,
    ({ isPlayingAll, number, isPlaying1, isPlaying2 }) => {
      if (number === "all") {
        if (!isPlayingAll) {
          selectedVideoRef1?.current?.pause();
          selectedVideoRef2?.current?.pause();
        } else {
          selectedVideoRef1?.current?.play();
          selectedVideoRef2?.current?.play();
        }
      }
      if (number === "one") {
        if (!isPlaying1) selectedVideoRef1?.current?.pause();
        else selectedVideoRef1?.current?.play();
      }
      if (number === "two") {
        if (!isPlaying2) selectedVideoRef2?.current?.pause();
        else selectedVideoRef2?.current?.play();
      }
      setIsPlaying({ isPlayingAll, number, isPlaying1, isPlaying2 });
    }
  );

  socket.on(EVENTS.ON_VIDEO_TIME, ({ clickedTime, number }) => {
    if (selectedVideoRef1.current) {
      if (number === "one") selectedVideoRef1.current.currentTime = clickedTime;
      else selectedVideoRef2.current.currentTime = clickedTime;
    }
  });

  //NOTE -  listening both selected clips and swapped videos with single event by type
  socket.on(EVENTS.ON_VIDEO_SELECT, ({ type , videos , mainScreen }) => {
    if(type === 'clips'){
      setSelectedClips(videos);
    }else{
      setPinnedUser(mainScreen)
      if(mainScreen){
          setIsPinned(true)
      }else{
        setIsPinned(false)
      }
    }
  });

  socket.on(EVENTS.ON_VIDEO_SHOW, ({ isClicked }) => {
    setMaxMin(isClicked);
  });

  const globalProgressBarToggler = (e) => {
    setVideoController(!videoController);
    // selectedVideoRef1.current.currentTime = 0;
    // selectedVideoRef2.current.currentTime = 0;
  };
  const handleGlobalProgressBarChange = (e) => {
    const { value } = e.target;
    const maxTime = Math.max(
      selectedVideoRef1.current?.duration || 0,
      selectedVideoRef2.current?.duration || 0
    );

    if (selectedVideoRef1.current) {
      selectedVideoRef1.current.currentTime = value;
      emitVideoTimeEvent(value, "one");
    }

    if (selectedVideoRef2.current) {
      selectedVideoRef2.current.currentTime = value;
      emitVideoTimeEvent(value, "two");
    }

    if (maxTime === value) {
      setIsPlaying({ ...isPlaying, isPlayingAll: false });
    }
  };

  const togglePlay = (num) => {
    var temp = isPlaying;
    temp.number = num;
    if (
      selectedVideoRef1?.current?.currentTime ===
        selectedVideoRef1?.current?.duration &&
      selectedVideoRef2?.current?.currentTime ===
        selectedVideoRef2?.current?.duration
    ) {
      selectedVideoRef1.current.currentTime = 0;
      emitVideoTimeEvent(0, "one");
      selectedVideoRef2.current.currentTime = 0;
      emitVideoTimeEvent(0, "two");
    }

    if (num === "all") {
      if (isPlaying.isPlayingAll) {
        selectedVideoRef1?.current?.pause();
        selectedVideoRef2?.current?.pause();
      } else {
        selectedVideoRef1?.current?.play();
        selectedVideoRef2?.current?.play();
      }
      temp = {
        ...isPlaying,
        isPlayingAll: !isPlaying.isPlayingAll,
        isPlaying1: !isPlaying.isPlayingAll,
        isPlaying2: !isPlaying.isPlayingAll,
      };
    } else if (num === "one") {
      if (isPlaying.isPlaying1) selectedVideoRef1?.current?.pause();
      else selectedVideoRef1?.current?.play();
      temp = { ...isPlaying, isPlaying1: !isPlaying.isPlaying1 };
    } else if (num === "two") {
      if (isPlaying?.isPlaying2) selectedVideoRef2?.current?.pause();
      else selectedVideoRef2.current.play();
      temp = { ...isPlaying, isPlaying2: !isPlaying.isPlaying2 };
    }

    socket?.emit(EVENTS?.ON_VIDEO_PLAY_PAUSE, {
      userInfo: { from_user: fromUser?._id, to_user: toUser?._id },
      ...temp,
    });
    setIsPlaying({ ...temp });
  };
  const emitVideoTimeEvent = (clickedTime, number) => {
    socket?.emit(EVENTS.ON_VIDEO_TIME, {
      userInfo: { from_user: fromUser?._id, to_user: toUser?._id },
      clickedTime,
      number,
    });
  };

  
  const handleTimeUpdate1 = () => {
    console.log("handleTimeUpdate1");
    if (progressBarRef?.current) {
      progressBarRef.current.value =
        selectedVideoRef1?.current?.currentTime || 0;
    }
    if (
      selectedVideoRef1.current.duration ===
      selectedVideoRef1.current.currentTime
    ) {
      togglePlay("one");
      selectedVideoRef1.current.currentTime = 0;
      socket?.emit(EVENTS?.ON_VIDEO_TIME, {
        userInfo: { from_user: fromUser?._id, to_user: toUser?._id },
        clickedTime: 0,
        number: "one",
      });
    }
    const remainingTime =
      selectedVideoRef1.current.duration -
      selectedVideoRef1.current.currentTime;

    setVideoTime({
      ...videoTime,
      currentTime1: `${String(
        Math?.floor(progressBarRef.current.value / 60)
      ).padStart(2, "0")}:${String(
        Math?.floor(progressBarRef.current.value % 60)
      ).padStart(2, "0")}`,
      remainingTime1: `${String(Math?.floor(remainingTime / 60)).padStart(
        2,
        "0"
      )}:${String(Math?.floor(remainingTime % 60)).padStart(2, "0")}`,
    });
  };

  // useEffect(() => {
  //   var obj = {}
  //   if (selectedVideoRef1?.current?.duration) {
  //     const remainingTime = selectedVideoRef1.current.duration - selectedVideoRef1.current.currentTime;
  //     obj.remainingTime1 = `${String(Math?.floor(remainingTime / 60)).padStart(2, '0')}:${String(Math?.floor(remainingTime % 60)).padStart(2, '0')}`
  //   }
  //   if (selectedVideoRef2?.current?.duration) {
  //     const remainingTime2 = selectedVideoRef2.current.duration - selectedVideoRef2.current.currentTime;
  //     obj.remainingTime2 = `${String(Math?.floor(remainingTime2 / 60)).padStart(2, '0')}:${String(Math?.floor(remainingTime2 % 60)).padStart(2, '0')}`
  //   }
  //   setVideoTime({
  //     ...videoTime,
  //     ...obj
  //   })
  // }, [selectedVideoRef2?.current?.duration, selectedVideoRef1?.current?.duration, selectedClips?.length])

  const handleTimeUpdate2 = () => {
    progressBarRef2.current.value =
      selectedVideoRef2?.current?.currentTime || 0;
    if (
      selectedVideoRef2.current.duration ===
      selectedVideoRef2.current.currentTime
    ) {
      togglePlay("two");
      selectedVideoRef2.current.currentTime = 0;
      socket?.emit(EVENTS?.ON_VIDEO_TIME, {
        userInfo: { from_user: fromUser?._id, to_user: toUser?._id },
        clickedTime: 0,
        number: "two",
      });
    }
    const remainingTime =
      selectedVideoRef2.current.duration -
      selectedVideoRef2.current.currentTime;
    setVideoTime({
      ...videoTime,
      currentTime2: `${String(
        Math?.floor(progressBarRef2.current.value / 60)
      ).padStart(2, "0")}:${String(
        Math?.floor(progressBarRef2.current.value % 60)
      ).padStart(2, "0")}`,
      remainingTime2: `${String(Math?.floor(remainingTime / 60)).padStart(
        2,
        "0"
      )}:${String(Math?.floor(remainingTime % 60)).padStart(2, "0")}`,
    });
  };

  const handleProgressBarClick = (e, number) => {
    var clickedTime;
    if (number === "one") {
      clickedTime =
        (e?.nativeEvent?.offsetX / progressBarRef?.current?.offsetWidth) *
        progressBarRef?.current.getAttribute("max");
      selectedVideoRef1.current.currentTime = clickedTime;
    } else {
      clickedTime =
        (e?.nativeEvent?.offsetX / progressBarRef2?.current?.offsetWidth) *
        progressBarRef2?.current.getAttribute("max");
      selectedVideoRef2.current.currentTime = clickedTime;
    }

    socket?.emit(EVENTS?.ON_VIDEO_TIME, {
      userInfo: { from_user: fromUser?._id, to_user: toUser?._id },
      clickedTime: clickedTime,
      number: number,
    });
  };

  const handleProgressBarChange = (e, number) => {
    const clickedTime = e.target.value;
    console.log(clickedTime, "handleProgressBarChange");
    if (number === "one") {
      selectedVideoRef1.current.currentTime = clickedTime;
    } else {
      selectedVideoRef2.current.currentTime = clickedTime;
    }

    socket?.emit(EVENTS?.ON_VIDEO_TIME, {
      userInfo: { from_user: fromUser?._id, to_user: toUser?._id },
      clickedTime: clickedTime,
      number: number,
    });
  };
  const handleVolumeChange = () => {
    // Update the video volume based on the input value (0 to 1)
    const newVolume = parseFloat(volumeInputRef.current.value);
    selectedVideoRef1.current.volume = newVolume;
    setVolume(newVolume); // Update state
  };

  const handleVolumeChange2 = () => {
    // Update the video volume based on the input value (0 to 1)
    const newVolume = parseFloat(volumeInputRef2.current.value);
    selectedVideoRef2.current.volume = newVolume;
    setVolume2(newVolume); // Update state
  };

  useEffect(() => {
    setScreenShot();
  }, [screenShots?.length]);

  const setScreenShot = async () => {
    var newReportImages = [];

    for (let index = 0; index < screenShots?.length; index++) {
      const element = screenShots[index];
      try {
        const response = await fetch(`${awsS3Url}${element?.imageUrl}`);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result.split(",")[1];
          newReportImages[index] = {
            ...element,
            imageUrl: `data:image/jpeg;base64,${base64data}`,
          };
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("Error fetching or converting image:", error);
      }
    }

    setReportArr([...newReportImages]);
  };

  var pdf = new jsPDF();

  const generatePDF = async () => {
    const content = document.getElementById("report-pdf");
    content.style.removeProperty("display");

    html2canvas(content, { type: "png" }).then(async (canvas) => {
      const imgData = canvas.toDataURL("image/png");

      // Calculate the width of the page
      var pageWidth = pdf.internal.pageSize.width;

      // Calculate the aspect ratio of the canvas
      var aspectRatio = canvas.width / canvas.height;

      // Calculate the height to maintain the aspect ratio
      var imgHeight = pageWidth / aspectRatio;

      // Add the canvas as an image to the PDF
      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, imgHeight);
      // pdf.save('yourDocument.pdf');

      // Get the data URL of the PDF
      const generatedPdfDataUrl = pdf.output("dataurlstring");

      // Convert data URL to Blob
      const byteCharacters = atob(generatedPdfDataUrl.split(",")[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const pdfBlob = new Blob([new Uint8Array(byteNumbers)], {
        type: "application/pdf",
      });

      // Create a File from the Blob
      const pdfFile = new File([pdfBlob], "generated_pdf.pdf", {
        type: "application/pdf",
      });

      var link = await createUploadLink();
      if (link) pushProfilePDFToS3(link, pdfFile);

      content.style.display = "none";

      var res = await createReport({
        sessions: id,
        trainer: fromUser?._id,
        trainee: toUser?._id,
        title: reportObj?.title,
        topic: reportObj?.topic,
        reportData: screenShots,
      });
      setIsOpenReport(false);
    });
  };

  async function pushProfilePDFToS3(presignedUrl, uploadPdf) {
    const myHeaders = new Headers({ "Content-Type": "application/pdf" });
    axios
      .put(presignedUrl, uploadPdf, {
        headers: myHeaders,
        onUploadProgress: (progressEvent) => {
          const { loaded, total } = progressEvent;
          const percentCompleted = (loaded / total) * 100;
          console.log("percentCompletedpercentCompleted", percentCompleted);
        },
      })
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  const createUploadLink = async () => {
    var payload = { session_id: id };
    const data = await getS3SignPdfUrl(payload);
    if (data?.url) return data?.url;
    else return "";
  };

  const handleRemoveImage = async (filename) => {
    var res = await removeImage({
      sessions: id,
      trainer: fromUser?._id,
      trainee: toUser?._id,
      filename: filename,
    });
    getReportData();
  };

  const handleCropImage = async (filename, blob) => {
    var res = await cropImage({
      sessions: id,
      trainer: fromUser?._id,
      trainee: toUser?._id,
      oldFile: filename,
    });
    if (res?.data?.url) await pushProfilePhotoToS3(res?.data?.url, blob);
    getReportData();
    setIsOpenCrop(false);
  };
  console.log(selectedClips, selectedClips.length, "selected  Clips");
  const isOnlyOneVideo = {
    height: isPinned ? '200px' : "37vw",
    // width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: isPinned ? '0px !important' : "-15px",
    marginLeft: isPinned ? '0px !important' : "-15px",
  };
  const isTwoVideos = { 
    height: isPinned ? '200px' : "37vw", 
    width: "100%" ,
    marginRight: isPinned ? '0px !important' : "-15px",
    marginLeft: isPinned ? '0px !important' : "-15px",};

  return (
    <React.Fragment>
      <canvas
        ref={canvasRef}
        id="drawing-canvas"
        width={document.getElementById("bookings")?.clientWidth}
        height={document.getElementById("bookings")?.clientHeight}
        className="canvas-print absolute all-0"
        style={{ left: 0, top: 0, width: "100%", height: "100%" }}
      />
      <div
        className="row"
        style={{ height: "100%", display: "flex", alignItems: "center" }}
      >
        {/* 1 */}
        {accountType === AccountType.TRAINER ? (
          <div className="col-lg-1 col-md-1 col-sm-12 z-50">
            <div>
              <CanvasMenuBar
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                setSketchPickerColor={(rgb) => {
                  setSketchPickerColor(rgb);
                }}
                undoDrawing={() => {
                  undoDrawing(
                    {
                      coordinates: storedLocalDrawPaths.sender,
                      theme: canvasConfigs.sender,
                    },
                    {
                      coordinates: storedLocalDrawPaths.receiver,
                      theme: {
                        lineWidth: canvasConfigs.receiver.lineWidth,
                        strokeStyle: canvasConfigs.receiver.strokeStyle,
                      },
                    }
                  );
                }}
                sketchPickerColor={sketchPickerColor}
                canvasConfigs={canvasConfigs}
                setCanvasConfigs={(config) => {
                  canvasConfigs = config;
                }}
                drawShapes={(shapeType) => {
                  selectedShape = shapeType;
                }}
                refreshDrawing={() => {
                  // deleting the canvas drawing
                  storedLocalDrawPaths.sender = [];
                  storedLocalDrawPaths.receiver = [];
                  clearCanvas();
                  sendClearCanvasEvent();
                }}
                selectedClips={selectedClips}
                setSelectedClips={setSelectedClips}
                toUser={toUser}
              />
            </div>
          </div>
        ) : (
          <div className="col-lg-1 col-md-6 col-sm-12 "></div>
        )}

        {/* 2 */}

        {
          <div
            className="col-lg-8 col-md-8 col-sm-12 "
            id="third"
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              flexDirection: "column",
            }}
          >
            {displayMsg?.msg && (
              <div
                className="no-user-joined font-weight-bold text-center"
                style={{
                  margin: displayMsg?.msg ? "auto" : "",
                  zIndex: displayMsg?.msg ? 8 : 1,
                }}
              >
                {displayMsg?.msg}
              </div>
            )}

            {selectedClips?.length && (
              <div
                // className="row"
                className={
                  isPinned
                    ? pinnedUser === "user-video-1"
                      ? "switch-clips-container"
                      : "scs2"
                    : "row"
                }
                style={{ 
                  zIndex: isPinned ? "999" : "auto",
                  border : '1px solid red' }}
                onClick={() => {
                 if(accountType === AccountType.TRAINER){
                  emitVideoSelectEvent('swap' , selectedClips , null)
                  setPinnedUser(null);
                  setIsPinned(false);
                 }
                }}
              >
                <div
                  className="row"
                  style={
                    mediaQuery.matches
                      ? selectedClips?.length === 1
                        ? isOnlyOneVideo
                        : isTwoVideos
                      : {}
                  }
                >
                  {selectedClips.length && selectedClips[0] ? (
                    <div
                      className="col-lg-6 col-md-6 col-sm-6 col-xs-12"
                      style={{
                        // padding: "1px !important",
                        height: "100%",
                        paddingRight: 0,
                      }}
                    >
                      <video
                        crossOrigin="anonymous"
                        id="selected-video-1"
                        style={{
                          height: isPinned 
                          ?accountType === AccountType.TRAINER 
                          ? '80%' 
                          : '100%'
                          : "34.5vw",
                          // width: "inherit",
                          // borderRadius: 10,
                          width: "100%",
                          objectFit: "cover",
                        }}
                        ref={selectedVideoRef1}
                        onTimeUpdate={handleTimeUpdate1}
                      >
                        <source
                          src={Utils?.generateVideoURL(selectedClips[0])}
                          type="video/mp4"
                        />
                      </video>
                      <canvas id="video-canvas-1" hidden></canvas>
                      {(accountType === AccountType.TRAINER &&
                        !videoController &&  !isPinned) &&(
                          <>
                            <div
                              className="Pause"
                              style={{
                                position: "relative",
                                zIndex: 10,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <div>
                                <p style={{ margin: 0, marginRight:"10px"}}>
                                  {videoTime?.currentTime1}
                                </p>{" "}
                              </div>
                              <div className="external-control-bar">
                                <button
                                  className="btn btn-primary px-1 py-1 my-3 mr-2"
                                  onClick={() => togglePlay("one")}
                                >
                                  {isPlaying?.isPlaying1 ? (
                                    <Pause
      
                                      style={{ verticalAlign: "middle"}}
                                    />
                                  ) : (
                                    <Play
      
                                     style={{ verticalAlign: "middle" }} />
                                  )}
                                </button>
                              </div>
                              {/* <progress
                            className="progress"
                            ref={progressBarRef}
                            value="0"
                            max={
                              selectedVideoRef1.current
                                ? selectedVideoRef1.current.duration
                                : 100
                            }
                            onClick={(e) => handleProgressBarClick(e, "one")}
                          /> */}

                              {/* UI changed of video time slider and made it on onChange effect  */}
                              <input
                                type="range"
                                // className="progress"
                                ref={progressBarRef}
                                step="0.01"
                                value={
                                  selectedVideoRef1.current?.currentTime || 0
                                }
                                max={selectedVideoRef1.current?.duration || 100}
                                onChange={(e) =>
                                  handleProgressBarChange(e, "one")
                                }

                              />
                              <div>
                                <p style={{ margin: 0, marginLeft: "10px" , fontSize :  '16px'}}>
                                  {videoTime?.remainingTime1}
                                </p>{" "}
                              </div>
                            </div>
                            {/* commented volume rannge  for now */}
                            {/* <div
                          className="progress1"
                          style={{
                            position: "relative",
                            zIndex: 10,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <p style={{ margin: 0, marginRight: "10px" }}>
                              Volume
                            </p>{" "}
                          </div>
                          <input
                            className="progress"
                            ref={volumeInputRef}
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={volume}
                            onChange={handleVolumeChange}
                          />
                        </div> */}
                          </>
                        )}
                    </div>
                  ) : null}
                  {selectedClips.length && selectedClips[1] ? (
                    <div
                      className="col-lg-6 col-md-6 col-sm-6 col-xs-12"
                      style={{
                        // padding: "1px",
                        height: "100%",
                        paddingLeft: 0,
                      }}
                    >
                      <video
                        crossOrigin="anonymous"
                        id="selected-video-2"
                        style={{
                          height: isPinned 
                          ? '100%'
                          : "34.5vw",
                          // width: "inherit",
                          // borderRadius: 10,
                          width: "100%",
                          objectFit: "cover",
                        }}
                        ref={selectedVideoRef2}
                        onTimeUpdate={handleTimeUpdate2}
                      >
                        <source
                          src={Utils?.generateVideoURL(selectedClips[1])}
                          type="video/mp4"
                        />
                      </video>
                      <canvas id="video-canvas-2" hidden></canvas>
                      {(accountType === AccountType.TRAINER &&
                        !videoController && !isPinned) && (
                          <>
                            <div
                              className="Pause2"
                              style={{
                                position: "relative",
                                zIndex: 10,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <div>
                                <p style={{ margin: 0, marginRight:"10px"}}>
                                  {videoTime?.currentTime2}
                                </p>{" "}
                              </div>
                              <div className="external-control-bar">
                                <button
                                  className="btn btn-primary px-1 py-1 my-3 mr-2 "
                                  onClick={() => togglePlay("two")}
      
                                >
                                  {isPlaying?.isPlaying2 ? (
                                    <Pause
        
                                      style={{ verticalAlign: "middle",  }}
                                    />
                                  ) : (
                                    <Play 
      
                                    style={{ verticalAlign: "middle",  }} />
                                  )}
                                </button>
                              </div>
                              {/* <progress
                            className="progress"
                            ref={progressBarRef2}
                            value="0"
                            max={
                              selectedVideoRef2.current
                                ? selectedVideoRef2.current.duration
                                : 100
                            }
                            onClick={(e) => handleProgressBarClick(e, "two")}
                          /> */}

                              {/* UI changed of video time slider and made it on onChange effect  */}
                              <input
                                type="range"
                                // className="progress"
                                ref={progressBarRef2}
                                step="0.01"
                                value={
                                  selectedVideoRef2.current?.currentTime || 0
                                }
                                max={selectedVideoRef2.current?.duration || 100}
                                onChange={(e) =>
                                  handleProgressBarChange(e, "two")
                                }
                             
                              />
                              <div>
                                <p style={{ margin: 0, marginLeft: "10px", }}>
                                  {videoTime?.remainingTime2}
                                </p>{" "}
                              </div>
                            </div>
                            {/* commented volume rannge  for now */}
                            {/* <div
                          className="progress2"
                          style={{
                            position: "relative",
                            zIndex: 10,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <p style={{ margin: 0, marginRight: "10px" }}>
                              Volume
                            </p>{" "}
                          </div>
                          <input
                            className="progress"
                            ref={volumeInputRef2}
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={volume2}
                            onChange={handleVolumeChange2}
                          />
                        </div> */}
                          </>
                        )}
                    </div>
                  ) : null}
                </div>
                {(accountType === AccountType.TRAINER && videoController && !isPinned) &&  (
                  <>
                    <div
                      className="Pause"
                      style={{
                        position: "relative",
                        zIndex: 10,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        marginInline: "auto",
                      }}
                    >
                      {/* <div>
                            <p style={{ margin: 0, marginRight: "10px" }}>
                              {videoTime?.currentTime1}
                            </p>{" "}
                          </div> */}
                      <div className="external-control-bar">
                        <button
                          className="btn btn-primary px-1 py-1 my-3 mr-2"
                          onClick={() => togglePlay("all")}
                        >
                          {isPlaying.isPlayingAll ? (
                            <Pause 
                            style={{ verticalAlign: "middle" }} />
                          ) : (
                            <Play 
                            style={{ verticalAlign: "middle" }} />
                          )}
                        </button>
                      </div>
                      <input
                        type="range"
                        ref={globalProgressBarRef}
                        step="0.01"
                        value={
                          (selectedVideoRef1.current?.currentTime || 0) >
                          (selectedVideoRef2.current?.currentTime || 0)
                            ? selectedVideoRef1.current?.currentTime || 0
                            : selectedVideoRef2.current?.currentTime || 0
                        }
                        max={
                          (selectedVideoRef1.current?.duration || 0) >
                          (selectedVideoRef2.current?.duration || 0)
                            ? selectedVideoRef1.current?.duration || 0
                            : selectedVideoRef2.current?.duration || 0
                        }
                        onChange={handleGlobalProgressBarChange}
                        style={ { width: "450px" }}
                      />
                      {/* <div>
                            <p style={{ margin: 0, marginLeft: "10px" }}>
                              {videoTime?.remainingTime1}
                            </p>{" "}
                          </div> */}
                    </div>
                  </>
                )}
              </div>
            )}
            
            {/* Timer  */}
            <div
              style={{
                position: "absolute",
                top: "5%",
                right: "-27%",
              }}
            >
              <div className="text-center">
                <h3>Time remaining</h3>
                <h2 style={{}}> {timeDifference}</h2>
              </div>
            </div>
            <div
              id="user-video-1"
              className={
                !selectedClips.length && isPinned && pinnedUser === 'user-video-2'
                ? 'scs2'
                : !selectedClips.length && isPinned && pinnedUser === 'user-video-1'
                ? "switch-user-video"
                :selectedClips.length 
                && isPinned 
                && 
                ((accountType === AccountType.TRAINER &&
                  pinnedUser === "user-video-1") ||
                  (accountType === AccountType.TRAINEE &&
                    pinnedUser === "user-video-2"))
                  ? "switch-user-video"
                  : selectedClips?.length !== 0 && mediaQuery.matches
                  ? "scs"
                  : ""
              }
              style={{
                zIndex: 
                !selectedClips.length && isPinned && pinnedUser === 'user-video-2' 
                ? '999'
                :selectedClips?.length != 0 && pinnedUser !== 'user-video-1' && pinnedUser 
                ? 999 
                : "auto",
                height:
                !selectedClips.length && isPinned && pinnedUser === 'user-video-2'
                ? "200px"
                :selectedClips?.length === 0 || pinnedUser === "user-video-1"
                      ? "500px"
                      : "200px",
                // marginTop:.
                //   selectedClips?.length != 0 && mediaQuery.matches
                //     ? "50px"
                //     : "20px",
                // marginBottom:
                //   selectedClips?.length != 0 && mediaQuery.matches
                //     ? "50px"
                //     : "20px",
                // paddingTop:
                //   selectedClips?.length != 0 && mediaQuery.matches
                //     ? "50px"
                //     : "20px",
                // paddingBottom:
                //   selectedClips?.length != 0 && mediaQuery.matches
                //     ? "50px"
                //     : "20px",
                marginTop: "20px",
                // top:
                //   pinnedUser !== "user-video-1" || pinnedUser === null
                //     ? "45% !important"
                //     : "50%",
                top:
                  isPinned && pinnedUser === "user-video-1"
                    ? "0% !important"
                    : pinnedUser !== "user-video-1" || pinnedUser === null
                    ? "45% !important"
                    : "50%",
                border: "1px solid #000",
                position:
                  displayMsg?.msg || isRemoteVideoOff ? "relative" : "relative",
              }}
              onClick={() => {
                if(accountType === AccountType.TRAINER){
                if (pinnedUser === "user-video-1") {
                  emitVideoSelectEvent('swap' , selectedClips , null)
                  setIsPinned(false);
                  setPinnedUser(null);
                } else {
                  emitVideoSelectEvent('swap' , selectedClips , "user-video-1")
                  setIsPinned(true);
                  setPinnedUser("user-video-1");
                }
                }
              }}
            >
              <video
                ref={remoteVideoRef}
                playsInline
                autoPlay
                className="rounded "
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit : 'cover'
                }}
                id="end-user-video"
              />
              <div
                style={{
                  position: "absolute",
                  top: "0",
                  left: "0",
                  right: "0",
                  bottom: "0",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  backgroundColor: "#d2d2d2",
                  display:
                    displayMsg?.msg || isRemoteVideoOff ? "flex" : "none",
                }}
              >
                {toUser?.profile_picture? (
                  <img
                    src={Utils.dynamicImageURL(toUser?.profile_picture)}
                    srcset=""
                    style={{
                      width: "150px",
                      height: "150px",
                      borderRadius: "50%",
                    }}
                    className="container-raj"
                  />
                ) : (
               
                    <div className="container-raj ">
                      <h1 className="text-box-raj">
                        {" "}
                        {getInitials(toUser?.fullname)}
                      </h1>
                    </div>

                )}
              </div>
            </div>

            <div
              id="user-video-2"
              className={
                !selectedClips.length && isPinned && pinnedUser === 'user-video-2'
                ? "switch-user-video"
                : selectedClips.length 
                && 
                isPinned 
                && 
                ((accountType === AccountType.TRAINER &&
                  pinnedUser === "user-video-2") ||
                  (accountType === AccountType.TRAINEE &&
                    pinnedUser === "user-video-1"))
                ? "switch-user-video"
                : mediaQuery.matches
                ? "scs2"
                : ""
              }
              style={{
                zIndex: isPinned && pinnedUser === 'user-video-2' ? 'auto' : 999,
                border: "1px solid #000",
                height:
                    isPinned && pinnedUser === "user-video-2"
                      ? "500px"
                      : "200px",
                // top :  selectedClips.length > 0 ?  "10% !important" : "20%"
                top:
                  isPinned && pinnedUser === "user-video-2"
                    ? "0% !important"
                    : pinnedUser !== "user-video-2" || pinnedUser === null
                    ? "10% !important"
                    : "20%",
                
                // pinnedUser !== "user-video-2" || pinnedUser === null
                //   ? "10% !important"
                //   : "20%",
                position: "relative",
              }}
              onClick={() => {
                if(accountType === AccountType.TRAINER){
                if (pinnedUser === "user-video-2") {
                  emitVideoSelectEvent('swap' , selectedClips , null)
                  setIsPinned(false);
                  setPinnedUser(null);
                } else {
                  emitVideoSelectEvent('swap' , selectedClips , 'user-video-2')
                  setIsPinned(true);
                  setPinnedUser("user-video-2");
                }
                }
              }}
            >
              <video
                id="end-user-video"
                playsInline
                muted
                className="rounded "
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit : 'cover',
                }}
                ref={videoRef}
                autoPlay
              />
              <div
                style={{
                  position: "absolute",
                  top: "0%",
                  left: "0%",
                  right: "0%",
                  bottom: "0%",
                  width: "100%",
                  height: "100%",
                  display: isFeedStopped ? "flex" : "none",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "#d2d2d2",
                }}
              >
                {fromUser.profile_picture ? (
                  <img
                    src={fromUser.profile_picture}
                    srcset=""
                    className="container-raj"
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "50%",
                    }}
                  />
                ) : (
                 
                    <div
                      className="container-raj"
                      style={{
                        width: "100px",
                        height: "100px",
                        borderRadius: "50%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <h1 className="text-box-raj">
                        {" "}
                        {getInitials(fromUser.fullname)}
                      </h1>
                    </div>
                
                )}
              </div>
            </div>
            {renderCallActionButtons()}
          </div>
        }

        <ReportModal
          currentReportData={{
            session: id,
            trainer: fromUser?._id,
            trainee: toUser?._id,
          }}
          isOpenReport={isOpenReport}
          setIsOpenReport={setIsOpenReport}
          screenShots={screenShots}
          setScreenShots={setScreenShots}
          // setScreenShots={setScreenShot}
          reportObj={reportObj}
          setReportObj={setReportObj}
        />

        <Modal isOpen={isModelOpen}>
          <ModalHeader>
            <h2>Recording</h2>
          </ModalHeader>
          <ModalBody>
            <div className="row">
              <Button
                className="mx-3"
                color="primary"
                onClick={() => {
                  startRecording();
                  setIsModelOpen(false);
                }}
              >
                Start Recording
              </Button>
              <Button
                className="mx-3"
                color="primary"
                onClick={() => {
                  setIsModelOpen(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </ModalBody>
        </Modal>
      </div>
      {isScreenShotModelOpen && (
        <ScreenShotDetails
          screenShotImages={screenShots}
          setScreenShotImages={setScreenShots}
          setIsOpenDetail={setIsScreenShotModelOpen}
          currentReportData={{
            session: id,
            trainer: fromUser?._id,
            trainee: toUser?._id,
          }}
          reportObj={reportObj}
        />
      )}
    </React.Fragment>
  );
};
