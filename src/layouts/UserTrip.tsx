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
import { Book, Edit, ExternalLink, FaceId, QuestionMark, Refresh, RefreshDot, Tag, Trash, Calendar, Photo, SettingsAutomation, Users } from "tabler-icons-react";

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
    const [checkOpen, setOpen] = useState(false);
    const handleChange = (e) => {
        setIsOpen(!checkOpen);
        setDate(e);
    };
    const handleClick = (e) => {
        e.preventDefault();
        setIsOpen(!checkOpen);
    };

    return (
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
                {isMobile &&
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
                }
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

                                {/* <>
                                    <button onClick={handleClick} type='button'>
                                        {date}
                                    </button>
                                    {isOpen && (
                                        <DatePicker selected={date} onChange={handleChange} inline />
                                    )}
                                </> */}
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


        </Stack >
    );
};
