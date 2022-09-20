/* eslint-disable */
import { Anchor, Image, Loader } from "@mantine/core";
import _ from "lodash";
import React, { Component, useEffect } from "react";
import { withTranslation } from "react-i18next";
import { Map, Marker, TileLayer, Popup, Polyline, CircleMarker, Circle } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { Icon } from "leaflet"
import { connect } from "react-redux";
import { AutoSizer, Grid } from "react-virtualized";
import { compose } from "redux";
import { Map2 } from "tabler-icons-react";
import Lightbox from "react-image-lightbox";

/* Mock up data */
import data from "./test_data.json"

import { useAppDispatch, useAppSelector } from "../store/store";
import { fetchPlaceAlbumsList } from "../actions/albumsActions";
import { fetchLocationClusters } from "../actions/utilActions";
import { serverAddress } from "../api_client/apiClient";
import { selectUserSelfDetails } from "../store/user/userSelectors";

import { LEFT_MENU_WIDTH, TOP_MENU_HEIGHT } from "../ui-constants";
import { HeaderComponent } from "./albums/HeaderComponent";

const SIDEBAR_WIDTH = LEFT_MENU_WIDTH;

export class JourneyMap extends Component {
    state = {
        visibleMarkers: [],
        visiblePlaceAlbums: [],
        locationClusters: [],
        width: window.innerWidth,
        height: window.innerHeight - TOP_MENU_HEIGHT - 60,
        userList: [],
        locationData: [],
        lightboxShow: false,
        isOpen: false,
        currentImgSrc: ""
    };

    constructor(props) {
        super(props);
        this.mapRef = React.createRef();
        this.preprocess = this.preprocess.bind(this);
    }

    componentDidMount() {
        if (this.props.albumsPlaceList.length === 0) {
            this.props.dispatch(fetchPlaceAlbumsList());
        }

        if (!this.props.fetchedLocationClusters) {
            this.props.dispatch(fetchLocationClusters());
        }

        console.log("in mount");
        // // const { pub, auth } = useAppSelector(store => store);
        // // const user = useAppSelector(selectUserSelfDetails);
        const userName = this.props.auth.access.name
        const apiEndpoint = "http://152.67.97.63:8083/api/0/last?user=" + userName + "&device=phone"
        fetch(apiEndpoint)
            .then(response => response.text())
            .then(result => console.log(result))
            .catch(error => console.log('error', error));
    }

    onViewportChanged = viewport => {
        this.setState({ viewport });

        const map = this.mapRef.current.leafletElement;

        // map.invalidateSize was undefined when this was called from Map div context
        if (map.invalidateSize) {
            map.invalidateSize(true);
        }

        const bounds = map.getBounds();

        const visibleMarkers = this.props.locationClusters.filter(loc => {
            const markerLat = loc[0];
            const markerLng = loc[1];
            if (
                markerLat < bounds._northEast.lat &&
                markerLat > bounds._southWest.lat &&
                markerLng < bounds._northEast.lng &&
                markerLng > bounds._southWest.lng
            ) {
                return true;
            }
            return false;
        });

        const visiblePlaceNames = visibleMarkers.map(el => el[2]);

        const visiblePlaceAlbums = this.props.albumsPlaceList.filter(el => {
            if (visiblePlaceNames.includes(el.title)) {
                return true;
            }
            return false;
        });

        this.setState({
            visibleMarkers: visibleMarkers,
            visiblePlaceAlbums: _.sortBy(visiblePlaceAlbums, ["geolocation_level", "photo_count"]),
        });
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        if (prevState.locationClusters.length === 0) {
            const visibleMarkers = nextProps.locationClusters;
            const visiblePlaceNames = visibleMarkers.map(el => el[2]);
            const visiblePlaceAlbums = nextProps.albumsPlaceList.filter(el => {
                if (visiblePlaceNames.includes(el.title)) {
                    return true;
                }
                return false;
            });

            return {
                visibleMarkers: nextProps.locationClusters,
                locationClusters: nextProps.locationClusters,
                visiblePlaceAlbums: _.sortBy(visiblePlaceAlbums, ["geolocation_level", "photo_count"]),
            };
        }
        return { ...prevState };
    }

    handleClick = event => {
        // this.setState({ isOpen: !this.state.isOpen });
        this.setState({ currentImgSrc: event.target.currentSrc })
        this.setState({ lightboxShow: !this.state.lightboxShow });
        console.log("clicked");
        console.log("event", event.target.currentSrc)
        // console.log(event);
    }

    preprocess() {
        // Define orginal marker source, and photos server address
        const serverAddress = "https://hallowelt.r18i.me";
        var source = "https://unpkg.com/leaflet@1.4.0/dist/images/marker-icon.png";
        var id = -1;
        var title = "";
        const visiblePlaceNames = this.state.visiblePlaceAlbums.map(el => el.title);
        // console.log(this.state.visiblePlaceAlbums)
        const markers = this.props.locationClusters.map((loc, index) => {
            if (loc[0] !== 0) {
                if (visiblePlaceNames.includes(loc[2])) {
                    const album_index = visiblePlaceNames.indexOf(loc[2]);
                    source = `${serverAddress}/media/thumbnails_big/${this.state.visiblePlaceAlbums[album_index].cover_photos[0].image_hash}`;
                    id = this.state.visiblePlaceAlbums[album_index].id;
                    title = this.state.visiblePlaceAlbums[album_index].title;
                }
                return <Marker key={index} position={[loc[0], loc[1]]} title={loc[2]}
                    icon={new Icon({ iconUrl: source, iconSize: [40, 60], iconAnchor: [12, 41] })}>
                    {/* Require Fix: ReactDOM.render is no longer supported in React 18. Use createRoot instead. Until you switch to the new API, your app will behave as if it's running React 17.*/}
                    <Popup>
                        <div>
                            <div>
                                Id: {id}, title: {title} <br />
                                <span><b>Description</b></span><br /><input id="Description" type="text" placeholder={title} /><br />
                            </div>
                            <img
                                src={source}
                                width="150"
                                height="150"
                                alt="no img"
                                onClick={this.handleClick}
                            />
                        </div>
                    </Popup>
                </Marker>
            }
            return <div />;
        });

        return markers;
    }

    /* Get Mock up data*/
    getLocation() {
        const userList = {};
        // console.log("Inside:", data);
        const locations = [];
        Object.keys(data).forEach((user) => {
            userList[user] = {};
            Object.keys(data[user]).forEach((device) => {
                userList[user][device] = [];
                // console.log("device", data[user][device]);
                data[user][device].forEach((item) => {
                    // console.log("item", item.lat)
                    locations.push([item.lat, item.lon]);
                });
            });
        });

        return locations;
    }

    render() {
        if (this.props.fetchedLocationClusters) {
            // console.log("auth", this.props.auth);
            // console.log("photodetails", this.props.photoDetails);
            const locationData = this.getLocation();
            const limeOptions = { color: 'black' };
            // const { data: userList } = useFetchUserListQuery();
            // console.log(data);
            // const fetchingUserList = useAppSelector(state => state.util.fetchingUserList);
            // console.log(fetchingUserList);

            const markers = this.preprocess();
            function MultipleMarkers() {
                // console.log(locationData);
                return locationData.map((coordinate, index) => {
                    // console.log([coordinate[0], coordinate[1]], index);
                    // console.log(coordinate.length);
                    return <CircleMarker key={index} center={[coordinate[0], coordinate[1]]} opacity={1} fillOpacity={1} radius={4}>
                        <Popup>
                            <div>
                                Trip index:{index} coordinate: {coordinate[0]}, {coordinate[1]}
                                <br />
                                <span><b>Description</b></span><br /><textarea id="Description" cols="25" rows="5"></textarea><br />
                                <br /><input type="button" id="okBtn" value="Save" />
                            </div>
                        </Popup>
                    </CircleMarker>;
                    // }
                });
            }
            return (
                <div>
                    <HeaderComponent
                        icon={<Map2 size={50} />}
                        title={this.props.t("journeymap")}
                    /*fetching={this.props.fetchingAlbumsPlaceList}*/
                    />
                    <div style={{ marginLeft: -5 }}>
                        <Map
                            ref={this.mapRef}
                            className="journey-tracking-map"
                            style={{
                                height: this.state.height,
                            }}
                            onViewportChanged={this.onViewportChanged}
                            center={[40, 0]}
                            zoom={2}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                url='https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
                                maxZoom="20"
                            />
                            <MarkerClusterGroup>{markers}</MarkerClusterGroup>

                            <Marker position={locationData[0]} icon={new Icon({ iconUrl: "https://unpkg.com/leaflet@1.4.0/dist/images/marker-icon.png", iconSize: [25, 41], iconAnchor: [12, 41] })}>
                                <Popup>
                                    <div>
                                        Start of the trip!
                                        <br />
                                        <span><b>Trip Name</b></span><br /><input id="Trip Name" type="text" /><br /><br />
                                        <span><b>Description</b></span><br /><textarea id="Description" cols="25" rows="5"></textarea><br />
                                        <br /><input type="button" id="okBtn" value="Save" />
                                    </div>
                                </Popup>
                            </Marker>
                            <MultipleMarkers />
                            <Polyline pathOptions={limeOptions} positions={locationData} />
                        </Map>
                        {console.log("lightbox", this.state.lightboxShow)}
                        {this.state.lightboxShow && (
                            < Lightbox
                                mainSrc={this.state.currentImgSrc}
                                // mainCustomContent={getVideoComponent(lightboxImageId)}
                                imageLoadErrorMessage=""
                                // toolbarButtons={[
                                //     <Toolbar
                                //         // photosDetail={photoDetails[lightboxImageId]}
                                //         // lightboxSidebarShow={lightboxSidebarShow}
                                //         closeSidepanel={closeSidepanel}
                                //     // isPublic={isPublic}
                                //     />,
                                // ]}
                                onCloseRequest={() => this.setState({ lightboxShow: false })}
                            // onAfterOpen={this.state.currentImgSrc}
                            // reactModalStyle={{
                            //     content: {},
                            //     overlay: {
                            //         right: lightboxSidebarShow ? LIGHTBOX_SIDEBAR_WIDTH : 0,
                            //         width: lightboxSidebarShow ? width - SCROLLBAR_WIDTH - LIGHTBOX_SIDEBAR_WIDTH : width,
                            //     },
                            // }}
                            />
                            // {lightboxSidebarShow ? (
                            //     <Sidebar photoDetail={getCurrentPhotodetail()} closeSidepanel={closeSidepanel} isPublic={isPublic} />
                            // ) : (
                            //     <div></div>
                            // )}
                        )}
                        {/* {console.log(this.state.isOpen)} */}
                        {this.state.isOpen && (
                            <dialog
                                className="dialog"
                                style={{ position: "absolute" }}
                                open
                                onClick={this.handleClick}
                            >
                                <img
                                    className="image"
                                    src={this.state.currentImgSrc}
                                    onClick={this.handleClick}
                                    alt="no image"
                                />
                            </dialog>
                        )}
                    </div>
                </div>
            );
        }
        return (
            <div style={{ height: this.props.height }}>
                <Loader>{this.props.t("placealbum.maploading")}</Loader>
            </div>
        );
    }
}


JourneyMap = compose(
    connect(store => ({
        albumsPlaceList: store.albums.albumsPlaceList,
        locationClusters: store.util.locationClusters,
        fetchingLocationClusters: store.util.fetchingLocationClusters,
        fetchedLocationClusters: store.util.fetchedLocationClusters,
        userList: store.util.userList,
        auth: store.auth,
        // photoDetails: store.photos,
    })),
    withTranslation()
)(JourneyMap);