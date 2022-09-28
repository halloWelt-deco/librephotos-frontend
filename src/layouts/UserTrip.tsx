import {
    Box,
    Button,
    Dialog,
    Divider,
    Group,
    Indicator,
    List,
    Loader,
    Modal,
    Popover,
    SimpleGrid,
    Stack,
    Table,
    Text,
    TextInput,
    Title,
} from "@mantine/core";
import DatePicker from "react-datepicker/dist/react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import React, { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Book, Edit, ExternalLink, FaceId, QuestionMark, Refresh, RefreshDot, Tag, Trash, Calendar, Photo, SettingsAutomation, Users, MapSearch } from "tabler-icons-react";
import moment from "moment";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
// import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';



import { rescanFaces, trainFaces } from "../actions/facesActions";
import { scanAllPhotos, scanNextcloudPhotos, scanPhotos } from "../actions/photosActions";
import {
    deleteMissingPhotos,
    fetchCountStats,
    fetchJobList,
    fetchNextcloudDirectoryTree,
    fetchSiteSettings,
    generateEventAlbumTitles,
    generateEventAlbums,
    updateUser,
} from "../actions/utilActions";
import { api } from "../api_client/api";
import { serverAddress } from "../api_client/apiClient";
import { ModalNextcloudScanDirectoryEdit } from "../components/modals/ModalNextcloudScanDirectoryEdit";
import { CountStats } from "../components/statistics";
import { useAppDispatch, useAppSelector } from "../store/store";
import { ModalAlbumEdit } from "../components/album/ModalAlbumEdit";
import { JourneyMap } from "./JourneyMap";

export const UserTrip = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isOpenNextcloudExplanation, setIsOpenNextcloudExplanation] = useState(false);
    const [isOpenCredentials, setIsOpenCredentials] = useState(false);
    const [isOpenUpdateDialog, setIsOpenUpdateDialog] = useState(false);
    const [avatarImgSrc, setAvatarImgSrc] = useState("/unknown_user.jpg");
    const [userSelfDetails, setUserSelfDetails] = useState({} as any);
    const [modalNextcloudScanDirectoryOpen, setModalNextcloudScanDirectoryOpen] = useState(false);
    const dispatch = useAppDispatch();
    const auth = useAppSelector(state => state.auth);
    const userSelfDetailsRedux = useAppSelector(state => state.user.userSelfDetails);
    const workerAvailability = useAppSelector(state => state.util.workerAvailability);
    const fetchedNextcloudDirectoryTree = useAppSelector(state => state.util.fetchedNextcloudDirectoryTree);
    const util = useAppSelector(state => state.util);
    const statusPhotoScan = useAppSelector(state => state.util.statusPhotoScan);
    const { t } = useTranslation();

    const open = () => setIsOpen(true);

    const close = () => setIsOpen(false);

    // open update dialog, when user was edited
    useEffect(() => {
        if (JSON.stringify(userSelfDetailsRedux) !== JSON.stringify(userSelfDetails)) {
            setIsOpenUpdateDialog(true);
        } else {
            setIsOpenUpdateDialog(false);
        }
    }, [userSelfDetailsRedux, userSelfDetails]);

    useEffect(() => {
        dispatch(fetchCountStats());
        fetchSiteSettings(dispatch);
        dispatch(api.endpoints.fetchUserSelfDetails.initiate(auth.access.user_id));
        dispatch(fetchNextcloudDirectoryTree("/"));
        if (auth.access.is_admin) {
            dispatch(fetchJobList());
        }
    }, []);

    useEffect(() => {
        setUserSelfDetails(userSelfDetailsRedux);
    }, [userSelfDetailsRedux]);

    let buttonsDisabled = !workerAvailability;
    buttonsDisabled = false;
    if (avatarImgSrc === "/unknown_user.jpg") {
        if (userSelfDetails.avatar_url) {
            setAvatarImgSrc(serverAddress + userSelfDetails.avatar_url);
        }
    }

    const { countStats } = useAppSelector(store => store.util);

    const [width, setWidth] = useState<number>(window.innerWidth);

    function handleWindowSizeChange() {
        setWidth(window.innerWidth);
    }
    useEffect(() => {
        window.addEventListener('resize', handleWindowSizeChange);
        return () => {
            window.removeEventListener('resize', handleWindowSizeChange);
        }
    }, []);

    const isMobile = width <= 768;

    const [click, setClick] = useState(false)
    function handleTripButton() {
        setClick(click => !click);
    }

    const [date, setDate] = useState(new Date());

    function SampleNextArrow(props) {
        const { className, style, onClick } = props;
        return (
            <div
                className={className}
                style={{ ...style, display: "block", background: "gray" }}
                onClick={onClick}
            />
        );
    }

    function SamplePrevArrow(props) {
        const { className, style, onClick } = props;
        return (
            <div
                className={className}
                style={{ ...style, display: "block", background: "gray" }}
                onClick={onClick}
            />
        );
    }

    const [clickCard, setClickCard] = useState(false)
    function handleClickCard() {
        setClickCard(clickCard => !clickCard);
    }

    const carouselSettings = {
        className: "center",
        centerMode: true,
        infinite: true,
        centerPadding: "60px",
        speed: 500,
        dots: true,
        slidesToShow: 3,
        slidesToScroll: 1,
        nextArrow: <SampleNextArrow />,
        prevArrow: <SamplePrevArrow />,
        adaptiveHeight: true,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 3,
                    dots: true
                }
            },
            {
                breakpoint: 600,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 2,
                    initialSlide: 2
                }
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]


    };

    return (
        <div>
            <Stack align="center" justify="flex-start">
                <Group spacing="xs">
                    <Book size={35} />
                    <Title order={2}>{t("sidemenu.usertrip")}</Title>
                </Group>

                <Group position="center">
                    <div>
                        <Title align="center">{countStats.num_photos}</Title>
                        <Group position="center">
                            <Button variant="subtle" color="dark" leftIcon={<Photo size={20} />}>
                                {t("countstats.photos")}
                            </Button>
                        </Group>
                    </div>

                    <div>
                        <Title align="center">{countStats.num_people}</Title>
                        <Group position="center">
                            <Button variant="subtle" color="dark" leftIcon={<Users size={20} />}>
                                {t("people")}
                            </Button>
                        </Group>
                    </div>

                    <div>
                        <Title align="center">{countStats.num_faces}</Title>
                        <Group position="center">
                            <Button variant="subtle" color="dark" leftIcon={<FaceId size={20} />}>
                                {t("faces")}
                            </Button>
                        </Group>
                    </div>

                    <div>
                        <Title align="center">{countStats.num_albumauto}</Title>
                        <Group position="center">
                            <Button variant="subtle" color="dark" leftIcon={<SettingsAutomation size={20} />}>
                                {t("events")}
                            </Button>
                        </Group>
                    </div>

                    <div>
                        <Title align="center">{countStats.num_albumdate}</Title>
                        <Group position="center">
                            <Button variant="subtle" color="dark" leftIcon={<Calendar size={20} />}>
                                {t("days")}
                            </Button>
                        </Group>
                    </div>
                </Group >

                {/* <CountStats /> */}
                {/* <Divider hidden /> */}
                <Divider />
                {isMobile &&
                    <Box
                        sx={theme => ({
                            backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[0],
                            padding: theme.spacing.xl,
                            borderRadius: theme.radius.md,
                            cursor: "pointer",

                            "&:hover": {
                                backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[5] : theme.colors.gray[1],
                            },
                        })}
                    >
                        <Divider />

                        <div
                            style={{
                                paddingTop: '20px',
                                boxSizing: 'content-box',
                            }}>
                            <Group position="center">
                                <Button color="Blue"
                                    style={{
                                        height: "120px",
                                        width: "120px",
                                        borderRadius: "50%",
                                        wordWrap: "break-word",
                                        // whitespace:"normal",
                                    }}
                                    onClick={handleTripButton}>
                                    Create Trip
                                </Button>
                            </Group>
                        </div>

                        {click &&
                            <Modal
                                zIndex={1500}
                                opened={click}
                                title={<Title>Create New Trip</Title>}
                                onClose={() => {
                                    setClick(false);
                                }}
                            >
                                <Stack>
                                    <Group>
                                        <Text color="dimmed">Trip Name:</Text>
                                        <input id="Trip Name" type="text" />
                                    </Group>
                                    <Group>
                                        <Text color="dimmed">Select Date:</Text>
                                        <DatePicker
                                            selected={date}
                                            onChange={(date) => setDate(date)}
                                        />
                                        {/* 
                                        <>
                                            <button onClick={handleClick} type='button' color="Blue">
                                                {moment(date).format("MMM Do YYYY, dddd")}
                                            </button>
                                            {isOpen && (
                                                <DatePicker selected={date} onChange={handleChange} inline />
                                            )}
                                        </> */}
                                    </Group>
                                    <Group>

                                    </Group>
                                    <Button
                                        // onClick={() => {
                                        //     dispatch(
                                        //         createNewUserAlbum(
                                        //             newAlbumTitle,
                                        //             selectedImages.map(i => i.id)
                                        //         )
                                        //     );
                                        //     onRequestClose();
                                        //     setNewAlbumTitle("");
                                        // }}
                                        // disabled={albumsUserList
                                        //     .map(el => el.title.toLowerCase().trim())
                                        //     .includes(newAlbumTitle.toLowerCase().trim())}
                                        type="submit"
                                    >
                                        {t("modalalbum.create")}
                                    </Button>
                                </Stack>
                            </Modal>
                        }
                    </Box>
                }
                <Group>
                    {/* <Divider /> */}
                    <MapSearch size={35} />
                    <Title order={2}>Trip Cards</Title>
                </Group>

            </Stack >
            <div style={{
                margin: "0 auto",
                padding: "40px",
                width: "100%",
                // color: "#333",
                // background: "#419be0",

            }}>
                <Slider {...carouselSettings}>
                    <div>
                        <img
                            style={{ height: "100%", width: "100%", objectFit: "contain" }}
                            src='https://www.technipages.com/wp-content/uploads/2020/12/Measure-distance-in-Google-Maps.jpg'
                            alt=""
                            onClick={handleClickCard} />
                    </div>
                    <div>
                        <img
                            style={{ height: "100%", width: "100%", objectFit: "contain" }}
                            src='https://www.myrouteonline.com/wp-content/uploads/2018/05/Food-Delivery-e1527422030523.jpg'
                            alt=""
                            onClick={handleClickCard} />
                    </div>
                    <div>
                        <img
                            style={{ height: "100%", width: "100%", objectFit: "contain" }}
                            src='https://i.stack.imgur.com/RfbqG.png'
                            alt=""
                            onClick={handleClickCard} />
                    </div>
                    <div>
                        <img
                            style={{ height: "100%", width: "100%", objectFit: "contain" }}
                            src='https://developers.google.com/maps/images/landing/hero_directions_api.png'
                            alt=""
                            onClick={handleClickCard} />
                    </div>
                </Slider>
                {clickCard &&
                    <Modal
                        zIndex={1500}
                        opened={clickCard}
                        title={<Title>Clicked Card</Title>}
                        onClose={() => {
                            setClickCard(false);
                        }}
                    >
                    </Modal>}
            </div>
            {/* <JourneyMap /> */}
        </div >
    );
};
