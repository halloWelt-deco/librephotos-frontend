import { Box, Button, Divider, Group, Modal, Stack, Text, Title } from "@mantine/core";
import "react-datepicker/dist/react-datepicker.css";
import React, { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Book, FaceId, Calendar, Photo, SettingsAutomation, Users, MapSearch } from "tabler-icons-react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import { Link, useParams } from "react-router-dom";
import { fetchCountStats } from "../actions/utilActions";
import { deleteAutoAlbum, fetchAutoAlbumsList, fetchAlbumsAutoGalleries } from "../actions/albumsActions";
import { useAppDispatch, useAppSelector } from "../store/store";
import { MiniMapView } from "./MiniMapView";

export const UserTrip = () => {
    const dispatch = useAppDispatch();
    const auth = useAppSelector(state => state.auth);
    const workerAvailability = useAppSelector(state => state.util.workerAvailability);
    const { albumsAutoList, fetchingAlbumsAutoList, fetchedAlbumsAutoList } = useAppSelector(store => store.albums);
    const { t } = useTranslation();
    const { countStats } = useAppSelector(store => store.util);
    const [width, setWidth] = useState<number>(window.innerWidth);
    const isMobile = width <= 768;

    useEffect(() => {
        if (albumsAutoList.length === 0) {
            dispatch(fetchAutoAlbumsList());
        }
    }, []);


    useEffect(() => {
        dispatch(fetchCountStats());
    }, []);


    let buttonsDisabled = !workerAvailability;
    buttonsDisabled = false;

    function handleWindowSizeChange() {
        setWidth(window.innerWidth);
    }

    useEffect(() => {
        window.addEventListener('resize', handleWindowSizeChange);
        return () => {
            window.removeEventListener('resize', handleWindowSizeChange);
        }
    }, []);

    const [click, setClick] = useState(false);
    const [clickCard, setClickCard] = useState(false);
    const [clickQR, setClickQR] = useState(false);
    const [startTrip, setStartTrip] = useState(false);

    function handleTripButton() {
        setClick(click => !click);
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

    const carouselSettings = {
        className: "center",
        centerMode: true,
        infinite: true,
        centerPadding: "60px",
        speed: 500,
        dots: true,
        slidesToShow: 3,
        slidesToScroll: 1,
        initialSlide: 3,
        nextArrow: <SampleNextArrow />,
        prevArrow: <SamplePrevArrow />,
        adaptiveHeight: true,
        responsive: [
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

    const [isTravelCard, setTravelCard] = useState(false);
    const [cards, setCards] = useState<any>([]);

    // Modal for selected mockup travel card
    const [modalID, setModalID] = useState("4");
    var modal_cards_props = {
        dataFromParent: false,
        id: "3",
        showmap: true,
        modal: true,
    };

    function travelCard() {
        // Mock up travel cards, connected with the auto generated albums
        const cards: any[] = [];
        if (!isTravelCard && albumsAutoList.length !== 0) {
            var travel_cards_props = {};
            albumsAutoList.forEach(album => {
                travel_cards_props = {
                    dataFromParent: true,
                    id: album.id,
                    showmap: false,
                    modal: false,
                };
                // select a mock up album to connect with modal 
                if (album.title === "Wednesday Early Morning  in Brisbane") {
                    travel_cards_props = {
                        dataFromParent: true,
                        id: album.id,
                        showmap: true,
                        modal: false
                    };

                    setModalID(album.id);
                    modal_cards_props.id = album.id;
                    cards.push(
                        <div
                            style={{ border: "20px solid black" }}
                            onDoubleClick={() => {
                                setClickCard(clickCard => !clickCard);
                            }}
                        >
                            <MiniMapView {...travel_cards_props} />
                        </div >
                    );
                } else {

                    cards.push(
                        <div style={{ border: "20px solid black" }}>

                            <MiniMapView {...travel_cards_props} />
                        </div >
                    );
                }
            });

            setTravelCard(true);
            setCards(cards);
        }
        return cards;
    }

    const RedirectPage = () => {
        window.location.href = `https://hallowelt.app.link/${auth.access.name}`;
    }

    return (
        < div >
            {/* Fetch for travel cards */}
            {!isTravelCard && travelCard()}
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

                {!isMobile && <Button onClick={() => { setClickQR(clickQR => !clickQR) }}> Config Location Tracking</Button >}
                {isMobile && <Button onClick={() => { RedirectPage() }}>Config Location Tracking</Button>}

                {/* If not mobile view, display QR code when clicked to config location tracking */}
                {clickQR &&
                    < Modal
                        zIndex={1500}
                        title={< Title > Scan to Setup Location Tracking </Title>}
                        opened={clickQR}
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
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
                                        }}>
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

                                    <Button
                                        onClick={() => { handleTripButton() }}
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
                    <MapSearch size={35} />
                    <Title order={2}>Trip Cards</Title>
                </Group>
            </Stack >

            <div style={{
                margin: "0 auto",
                padding: "40px",
            }}>
                <Slider {...carouselSettings}>
                    {cards}
                </Slider>

                {clickCard &&
                    //Mock Up modal for trip card
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
                            <Link to={`/event/${modalID}`} > <Button >
                                View Album
                            </Button></Link>
                        </div>
                        <div>
                            <MiniMapView {...{
                                dataFromParent: false,
                                id: modalID,
                                showmap: true,
                                modal: true,
                            }} />
                        </div>
                    </Modal>}
            </div >
        </div >
    );
};
