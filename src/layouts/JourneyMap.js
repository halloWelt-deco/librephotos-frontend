/* eslint-disable */
import { Anchor, Button, Group, Image, Loader, Menu, ActionIcon, Divider, Modal, Title, THEME_ICON_SIZES } from "@mantine/core";
import _ from "lodash";
import React, { Component, useEffect } from "react";
import { withTranslation } from "react-i18next";
import { Map, Marker, TileLayer, Popup, Polyline, CircleMarker, Circle } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { Icon } from "leaflet"
import { connect } from "react-redux";
import { AutoSizer, Grid } from "react-virtualized";
import { compose } from "redux";
import { Map2, Calendar, DotsVertical, Album } from "tabler-icons-react";
import Lightbox from "react-image-lightbox";

// import Dropdown from 'react-bootstrap/Dropdown';
// import DropdownButton from 'react-bootstrap/DropdownButton';
import DatePicker from "react-datepicker/dist/react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

/* Mock up data */
import data from "./test_data.json";

import { useAppDispatch, useAppSelector } from "../store/store";
import { fetchPlaceAlbumsList, fetchAutoAlbumsList, fetchAlbumsAutoGalleries } from "../actions/albumsActions";
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
        lightboxShow: false,
        currentImgSrc: "",
        userData: [],
        addedMarkers: [],
        date: new Date(),
        selectingDate: false,
        selectedAlbum: false,
        selectedAlbumMarkers: [],
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

        if (this.props.albumsAutoList.length === 0) {
            this.props.dispatch(fetchAutoAlbumsList());
        }

        if (!(this.props.albumsAutoList.length === 0)) {
            this.props.albumsAutoList.map((dict) => {
                fetchAlbumsAutoGalleries(this.props.dispatch, dict["id"]);
            })
        }
        // need to keep this to ensure that the fetch auto album runs correctly
        console.log(this.props.albumsAutoList.length)
        
        // const userName = this.props.auth.access.name
        const userName = "user";

        const data = require("../owntracks-data/" + userName + "_data.json");
        this.setState({ userData: data });
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
        this.setState({ currentImgSrc: event.target.currentSrc });
        this.setState({ lightboxShow: !this.state.lightboxShow });
    }

    preprocess() {
        // Define orginal marker source, and photos server address
        const serverAddress = "https://hallowelt.r18i.me";
        var source = "https://unpkg.com/leaflet@1.4.0/dist/images/marker-icon.png";
        var id = -1;
        var title = "";
        const visiblePlaceNames = this.state.visiblePlaceAlbums.map(el => el.title);
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
                                <input type="button" id="okBtn" value="Save" />
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
        const locations = [];
        Object.keys(data).forEach((user) => {
            Object.keys(data[user]).forEach((device) => {
                data[user][device].forEach((item) => {
                    locations.push([item.lat, item.lon]);
                });
            });
        });
        return locations;
    }

    selectData(userD) {
        // Extract location from all of user's devices
        // const userList = {};
        const locations = [];
        for (var points in userD["data"]) {
            // userList[data[key].device] = [];
            locations.push([userD["data"][points].lat, userD["data"][points].lon]);
        }
        return locations;
    }

    MultipleMarkers(userlocationsdata) {
        return userlocationsdata.map((coordinate, index) => {
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
        });
    }

    addMarker = event => {
        const newmarker = this.state.addedMarkers
        newmarker.push(event.latlng)
        this.setState({ addedMarkers: newmarker })
    }

    removeMarker = (pos) => {
        this.setState({
            addedMarkers:
                this.state.addedMarkers.filter(coord => JSON.stringify(coord) !== JSON.stringify(pos))
        });
    };

    draggedMarker = event => {
        const latLng = event.target.getLatLng(); //get updated marker LatLng
        const markerIndex = event.target.options.marker_index; //get marker index
        //update 
        this.setState(prevState => {
            const addedMarkers = [...prevState.addedMarkers];
            addedMarkers[markerIndex] = latLng;
            return { addedMarkers: addedMarkers };
        });
    }

    handleSelectDate() {
        this.setState({ selectingDate: !selectingDate });
    }

    selectDate() {
        // console.log("value");
        return (
            <Modal
                zIndex={1500}
                opened={this.state.selectingDate}
                title={<Title>Select Date</Title>}
                onClose={this.handleSelectDate}
            >
                <DatePicker selected={this.state.date} onChange={(new_date) => this.setState({ date: new_date })} />
            </Modal>
        );

    }

    fetchingAutoAlbum(title, id) {
        // fetchAlbumsAutoGalleries(this.props.dispatch, id);
        this.setState({ selectedAlbum: !this.state.selectedAlbum });
        const markers = this.displayAlbum(this.props.albumsAutoGalleries[id]);
        this.setState({ selectedAlbumMarkers: markers })
    }

    displayAlbum(id) {
        this.setState({ selectedAlbum: !this.state.selectedAlbum });
        console.log(this.props.albumsAutoGalleries[id])
        const markers = this.props.albumsAutoGalleries[id]["photos"].map((photos, index) => {
            console.log(photos);
            console.log(photos["geolocation_json"].length)
            if (!(Object.keys(photos["geolocation_json"]).length === 0)) {
                const loc = photos["geolocation_json"]["query"];
                const source = `${serverAddress}/media/thumbnails_big/${photos["image_hash"]}`;
                const title = photos["geolocation_json"]["search_text"];
                if (loc[1]) {
                    return <Marker key={index} position={[loc[1], loc[0]]} title={title}
                        icon={new Icon({ iconUrl: source, iconSize: [40, 60], iconAnchor: [12, 41] })}>
                        {/* Require Fix: ReactDOM.render is no longer supported in React 18. Use createRoot instead. Until you switch to the new API, your app will behave as if it's running React 17.*/}
                        <Popup>
                            <div>
                                <div>
                                    Id: {index}, title: {title} <br />
                                    <span><b>Description</b></span><br /><input id="Description" type="text" placeholder={title} /><br />
                                    <input type="button" id="okBtn" value="Save" />
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

            }
        }
        );
        this.setState({ selectedAlbumMarkers: markers })
    }

    listAlbums() {
        return <Menu
            control={
                <ActionIcon>
                    <Album></Album>
                </ActionIcon>
            }
            title={"Select Album"}
        >

            <Menu.Label>
                {"Select Album"}
            </Menu.Label>
            <Divider />

            {this.props.albumsAutoList.map((dict) => {
                // fetchAlbumsAutoGalleries(this.props.dispatch, dict["id"]);

                // console.log(dict["id"])
                return <Menu.Item
                    icon={<Album></Album>}
                    //disabled={selectedItems.length === 0}
                    onClick={() => {
                        this.displayAlbum(dict["id"])
                    }}
                >
                    {dict["title"]}

                </Menu.Item>
            })}
        </Menu>
    }

    render() {

        if (this.props.fetchedLocationClusters) {
            const locationData = this.getLocation();
            const limeOptions = { color: 'black' };
            const userlocationsdata = this.selectData(this.state.userData);
            //console.log(userlocationsdata.slice(0, 10))

            // Get album markers
            const markers = this.preprocess();
            //console.log(this.state.addedMarkers)
            return (
                <div>
                    <HeaderComponent
                        icon={<Map2 size={50} />}
                        title={this.props.t("journeymap")}
                    /*fetching={this.props.fetchingAlbumsPlaceList}*/
                    />
                    <Group style={{ display: "flex", justifyContent: 'flex-end' }}>
                        <Menu
                            control={
                                <ActionIcon>
                                    <Calendar></Calendar>
                                </ActionIcon>
                            }
                            title={"Select Time"}
                        >

                            <Menu.Label>
                                {"Select Time"}
                            </Menu.Label>
                            <Divider />

                            <Menu.Item
                                icon={<Calendar></Calendar>}
                                //disabled={selectedItems.length === 0}
                                onClick={() => {
                                    this.selectDate()
                                }}
                            >
                                {`${"Start Date"}`}

                            </Menu.Item>
                        </Menu>

                        {this.listAlbums()}
                    </Group >
                    <div style={{ marginLeft: -5 }}>
                        <Map
                            ref={this.mapRef}
                            className="journey-tracking-map"
                            style={{
                                height: this.state.height - 40,
                            }}
                            onViewportChanged={this.onViewportChanged}
                            center={[40, 0]}
                            zoom={2}
                            ondblclick={this.addMarker}
                            doubleClickZoom={false}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                url='https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
                                maxZoom="20"
                            />
                            {console.log(this.state.selectedAlbum)}
                            {!this.state.selectedAlbum && (
                                <MarkerClusterGroup>{markers}</MarkerClusterGroup>
                            )}

                            {!this.state.selectedAlbum && (
                                <Marker position={userlocationsdata[0]} icon={new Icon({ iconUrl: "https://unpkg.com/leaflet@1.4.0/dist/images/marker-icon.png", iconSize: [25, 41], iconAnchor: [12, 41] })}>
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
                            )}

                            {!this.state.selectedAlbum && (
                                <Marker position={userlocationsdata.at(-1)} icon={new Icon({ iconUrl: "https://unpkg.com/leaflet@1.4.0/dist/images/marker-icon.png", iconSize: [25, 41], iconAnchor: [12, 41] })}>
                                    <Popup>
                                        <div>
                                            End of the trip!
                                            <br />
                                            <span><b>Trip Name</b></span><br /><input id="Trip Name" type="text" /><br /><br />
                                            <span><b>Description</b></span><br /><textarea id="Description" cols="25" rows="5"></textarea><br />
                                            <br /><input type="button" id="okBtn" value="Save" />
                                        </div>
                                    </Popup>
                                </Marker>,
                                <Polyline pathOptions={limeOptions} positions={userlocationsdata} />
                            )}


                            {!this.state.selectedAlbum && (

                                this.state.addedMarkers.map((pos, idx) =>
                                    <Marker key={`marker-${idx}`} marker_index={idx} position={pos} draggable={true} onDragend={this.draggedMarker}>
                                        <Popup >
                                            <div style={{ width: "max-content" }}>
                                                Marker index:{idx}
                                                <br />
                                                coordinate_lat: {pos.lat},
                                                <br />
                                                {pos.lng}
                                                <br />
                                                <span><b>Description</b></span><br /><textarea id="Description" cols="25" rows="5"></textarea><br />
                                                <br /><input type="button" id="okBtn" value="Save" />
                                                <button onClick={() => this.removeMarker(pos)}>Remove marker</button>
                                            </div>
                                        </Popup>
                                    </Marker>
                                )
                            )}



                            {this.state.selectedAlbum && (
                                <MarkerClusterGroup>{this.state.selectedAlbumMarkers}</MarkerClusterGroup>
                            )}



                        </Map>

                        {this.state.lightboxShow && (
                            < Lightbox
                                mainSrc={this.state.currentImgSrc}
                                imageLoadErrorMessage=""
                                onCloseRequest={() => this.setState({ lightboxShow: false })}
                            />
                        )}

                        {this.state.selectingDate

                        }
                    </div>
                </div >
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
        albumsAutoList: store.albums.albumsAutoList,
        albumsAutoGalleries: store.albums.albumsAutoGalleries,
        // fetchedAlbumsAutoGalleries: store.albums.fetchedAlbumsAutoGalleries,
        // fetchingAlbumsAutoGalleries: store.albums.fetchingAlbumsAutoGalleries,

        locationClusters: store.util.locationClusters,
        fetchingLocationClusters: store.util.fetchingLocationClusters,
        fetchedLocationClusters: store.util.fetchedLocationClusters,
        userList: store.util.userList,
        auth: store.auth,
        // photoDetails: store.photos,
    })),
    withTranslation()
)(JourneyMap);