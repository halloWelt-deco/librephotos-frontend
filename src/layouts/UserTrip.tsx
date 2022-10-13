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

import { Link, useParams } from "react-router-dom";



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
import { deleteAutoAlbum, fetchAutoAlbumsList, fetchAlbumsAutoGalleries } from "../actions/albumsActions";
import { api } from "../api_client/api";
import { serverAddress } from "../api_client/apiClient";
import { ModalNextcloudScanDirectoryEdit } from "../components/modals/ModalNextcloudScanDirectoryEdit";
import { CountStats } from "../components/statistics";
import { useAppDispatch, useAppSelector } from "../store/store";
import { ModalAlbumEdit } from "../components/album/ModalAlbumEdit";
import { MiniMapView } from "./MiniMapView";

// import { cornersOfRectangle } from "@dnd-kit/core/dist/utilities/algorithms/helpers";


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
    const { albumsAutoGalleries, fetchingAlbumsAutoGalleries } = useAppSelector(store => store.albums);
    const { albumID } = useParams();


    const { albumsAutoList, fetchingAlbumsAutoList, fetchedAlbumsAutoList } = useAppSelector(store => store.albums);
    useEffect(() => {
        if (albumsAutoList.length === 0) {
            dispatch(fetchAutoAlbumsList());
        }
    }, []);

    // useEffect(() => {
    //     if (!(albumsAutoList.length === 0)) {
    //         albumsAutoList.forEach((dict) => {
    //             fetchAlbumsAutoGalleries(dispatch, dict.id);
    //         })
    //     }
    // }, []);

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
    const [startTrip, setStartTrip] = useState(false);
    function handleStartTrip() {
        setStartTrip(startTrip => !startTrip);
        //  store the timestamp of every time the Start Trip and End Trip button is pressed to a JSON file
        //  timestamp of start trip
        var timestamp = new Date();
        var timestamp_start = timestamp
        //  timestamp of end trip
        var timestamp_end = timestamp
        //  data to be stored in JSON file
        var data = {
            "trip_name": "",
            "start_trip": timestamp_start,
            "end_trip": timestamp_end
        }
        //  store data in JSON file
        var json = JSON.stringify(data);
        console.log(json);
        // var fs = require('fs');
        // fs.writeFile('trip.json', json, 'utf8', function (err) {
        //     if (err) throw err;
        //     console.log('complete');
        // });
    }


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


    const [clickQR, setClickQR] = useState(false)
    function handleClickQR() {
        setClickQR(clickQR => !clickQR);
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
            // {
            //     breakpoint: 1024,
            //     settings: {
            //         slidesToShow: 3,
            //         slidesToScroll: 3,
            //         dots: true
            //     }
            // },
            // {
            //     breakpoint: 600,
            //     settings: {
            //         slidesToShow: 2,
            //         slidesToScroll: 2,
            //         initialSlide: 2
            //     }
            // },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    centerMode: false
                }
            }
        ]
    };

    // mock images
    var imgUrl = [
        // "https://www.technipages.com/wp-content/uploads/2020/12/Measure-distance-in-Google-Maps.jpg",
        // "https://www.myrouteonline.com/wp-content/uploads/2018/05/Food-Delivery-e1527422030523.jpg",
        // "https://i.stack.imgur.com/RfbqG.png",
        "https://developers.google.com/maps/images/landing/hero_directions_api.png",
    ]

    const [selectedImg, setSelectedImg] = useState<number>(-1)
    const [selectedImgSrc, setSelectedImgSrc] = useState("")

    function handleClickImage(e) {
        //console.log(e);
        //console.log(e.target.id);
        setSelectedImg(e.target.id);
        setSelectedImgSrc(e.target.src);
    }

    const [id, setId] = useState("")
    const [isTravelCard, setTravelCard] = useState(false)

    const modal_cards_props = {
        dataFromParent: false,
        id: "4",
        showmap: true

    }

    const [cards, setCards] = useState<any>([])
    useEffect(() => {
        travelCard();
    }, []);

    function travelCard() {
        // Mock up travel cards, connected with the auto generated albums
        const cards: any[] = [];
        if (!isTravelCard) {
            var travel_cards_props = {}
            // console.log("albbums", albumsAutoList)

            // console.log(album);
            travel_cards_props = {
                dataFromParent: true,
                id: "4",
                showmap: true
            }
            cards.push(
                <div style={{ border: "20px solid black" }} onDoubleClick={(event) => {
                    handleClickImage(event);
                    handleClickCard();
                }}
                >
                    <MiniMapView {...travel_cards_props} />
                </div >
            )
            //console.log("user", isTravelCard);

            travel_cards_props = {
                dataFromParent: true,
                id: "2",
                showmap: false
            }
            cards.push(
                <div style={{ border: "20px solid black" }}>
                    <MiniMapView {...travel_cards_props} />
                </div >
            )

            travel_cards_props = {
                dataFromParent: true,
                id: "3",
                showmap: false
            }
            cards.push(
                <div style={{ border: "20px solid black" }}>
                    <MiniMapView {...travel_cards_props} />
                </div >
            )

            travel_cards_props = {
                dataFromParent: true,
                id: "7",
                showmap: false
            }
            cards.push(
                <div style={{ border: "20px solid black" }}>
                    <MiniMapView {...travel_cards_props} />
                </div >
            )

            setTravelCard(true);
            setCards(cards)
        }
        return cards
    }

    const RedirectPage = () => {
        window.location.href = `https://hallowelt.app.link/${auth.access.name}`;
    }

    return (
        < div >
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

                {/* <Divider hidden /> */}
                {!isMobile && <Button onClick={handleClickQR}> Config Location Tracking</Button >}
                {isMobile && <Button onClick={() => { RedirectPage() }}>Config Location Tracking</Button>}
                {clickQR &&
                    < Modal
                        zIndex={1500}
                        title={< Title > Scan to set up location tracking </Title>}
                        opened={clickQR}
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            // top: "50%",
                        }}
                        onClose={() => setClickQR(false)}
                    >
                        <div>
                            <img
                                style={{ height: "80%", width: "100%", objectFit: "contain" }}
                                src="/QR_code.png"
                                alt=""
                            />
                        </div>
                    </Modal>
                }

                <Divider />
                {
                    isMobile &&
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

                        {!startTrip &&
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
                                        Start Trip
                                    </Button>
                                </Group>
                            </div>

                            || startTrip && !click &&
                            <div
                                style={{
                                    paddingTop: '20px',
                                    boxSizing: 'content-box',
                                }}>
                                <Group position="center">
                                    <Button color="green"
                                        style={{
                                            height: "120px",
                                            width: "120px",
                                            borderRadius: "50%",
                                            wordWrap: "break-word",
                                            // whitespace:"normal",
                                        }}
                                        onClick={handleStartTrip}>
                                        End Trip
                                    </Button>
                                </Group>
                            </div>
                        }

                        {click && !startTrip &&
                            <Modal
                                zIndex={1500}
                                opened={click}
                                title={<Title>Start New Trip</Title>}
                                onClose={handleTripButton}
                            >
                                <Stack>
                                    <Group>
                                        <Text color="dimmed">Trip Name:</Text>
                                        <input id="Trip Name" type="text" />
                                    </Group>
                                    {/* <Group>
                                        <Text color="dimmed">Select Date:</Text>
                                        <DatePicker
                                            selected={date}
                                            onChange={(date) => setDate(date)}
                                        />
                                    </Group> */}
                                    <Group>

                                    </Group>
                                    <Button
                                        onClick={() => {
                                            // Start new trip, store details + datetime
                                            handleStartTrip();
                                            handleTripButton();
                                        }}
                                        type="submit"
                                    >
                                        Start
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
                // width: "100%",
            }}>
                <Slider {...carouselSettings}>
                    {cards}
                </Slider>

                {clickCard &&
                    <Modal
                        zIndex={1500}
                        opened={clickCard}
                        title={<Title>Selected Card</Title>}
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            top: "20%",
                        }}
                        onClose={() => {
                            setClickCard(false);
                        }}
                    >
                        <div>
                            <Link to="/Journey" > <Button >
                                View Map
                            </Button></Link>
                            <Link to="/event/4" > <Button >
                                View Album
                            </Button></Link>
                        </div>
                        <div>
                            <MiniMapView {...modal_cards_props} />
                        </div>
                    </Modal>}

            </div >
            {/* <JourneyMap /> */}
        </div >
    );
};
