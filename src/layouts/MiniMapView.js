/* eslint-disable */
import { Anchor, Button, Group, Image, Loader, Menu, ActionIcon, Divider, Modal, Title, THEME_ICON_SIZES } from "@mantine/core";
import _ from "lodash";
import React, { Component, useEffect } from "react";
import { withTranslation } from "react-i18next";
import { Map, Marker, TileLayer, Popup, Polyline, CircleMarker, Circle, FeatureGroup } from "react-leaflet";
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { Icon } from "leaflet"
import { connect } from "react-redux";
import { AutoSizer, Grid } from "react-virtualized";
import { compose } from "redux";
import { Map2, Calendar, DotsVertical, Album, Home } from "tabler-icons-react";
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

export class MiniMapView extends Component {
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
        getMakers: false,
        imgMarkers: [],
    };

    constructor(props) {
        super(props);
        this.mapRef = React.createRef();
        this.groupRef = React.createRef();
        this.preprocess = this.preprocess.bind(this);
    }

    componentDidMount() {
        if (this.props.albumsPlaceList.length === 0) {
            this.props.dispatch(fetchPlaceAlbumsList());
        }
        console.log("fetch", this.props.fetchedLocationClusters);
        if (!this.props.fetchedLocationClusters) {
            this.props.dispatch(fetchLocationClusters());
        }

        if (this.props.albumsAutoList.length === 0) {
            this.props.dispatch(fetchAutoAlbumsList());
        }

        if (!this.props.fetchedAlbumsAutoGalleries) {
            // this.props.albumsAutoList.map((dict) => {
            fetchAlbumsAutoGalleries(this.props.dispatch, this.props.id);
            // })
        }
        console.log(this.props.fetchedAlbumsAutoGalleries)
        // if (!this.props.fetchedAlbumsAutoGalleries) {
        //     fetchAlbumsAutoGalleries(this.props.dispatch, this.props.id);
        // }
        // need to keep this to ensure that the fetch auto album runs correctly
        //console.log(this.props.albumsAutoList.length)

        // const userName = this.props.auth.access.name
        const userName = "user";

        const data = require("../owntracks-data/" + userName + "_data.json");
        this.setState({ userData: data });

        // const group = this.groupRef.current.leafletElement;
        // console.log(group);
        // console.log(group.getBounds());
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

    displayAlbum(id) {
        // Need to keep this to ensure it runs?
        //console.log(id)
        // console.log("display album", this.props.album[id])
        //console.log("display", this.props.albumsAutoGalleries[id]);

        // const map = this.mapRef.current.leafletElement;
        // map.flyTo([this.props.albumsAutoGallery["gps_lat"], this.props.albumsAutoGallery["gps_lon"]], 10);

        // this.setState({ selectedAlbum: true });
        // console.log(this.props.albumsAutoGalleries[id])
        var markers = []
        if (Object.keys(this.props.albumsAutoGalleries[this.props.id]).length !== 0) {
            markers = this.props.albumsAutoGalleries[this.props.id]["photos"].map((photos, index) => {
                // console.log(photos);
                // console.log(photos["geolocation_json"].length)
                if (!(Object.keys(photos["geolocation_json"]).length === 0)) {
                    const loc = photos["geolocation_json"]["query"];
                    const source = `${serverAddress}/media/thumbnails_big/${photos["image_hash"]}`;
                    const title = photos["geolocation_json"]["search_text"];
                    if (loc[1]) {
                        return <Marker key={index} position={[loc[1], loc[0]]} title={title}
                            icon={new Icon({ iconUrl: source, iconSize: [40, 60], iconAnchor: [12, 41] })}>
                            {/* Require Fix: ReactDOM.render is no longer supported in React 18. Use createRoot instead. Until you switch to the new API, your app will behave as if it's running React 17.*/}
                            {/* <Popup>
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
                        </Popup> */}
                        </Marker>
                    }

                }
            }
            );
        }
        // this.setState({ selectedAlbumMarkers: markers })
        return markers
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
                return <Menu.Item
                    icon={<Album></Album>}
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
        var options = {};

        if (this.props.dataFromParent) {
            options = {
                zoomControl: false,
                dragging: false,
                doubleClickZoom: false,
                closePopupOnClick: false,
                zoomSnap: false,
                zoomDelta: false,
                trackResize: false,
                touchZoom: false,
                scrollWheelZoom: false,
                boxZoom: false,
            }
        }
        // const markers = this.displayAlbum(this.props.album["id"])
        // Get auto created albums
        // if ((Object.keys(this.props.albumsAutoGalleries).length === 0)) {
        //     this.props.albumsAutoList.map((dict) => {
        //         fetchAlbumsAutoGalleries(this.props.dispatch, dict["id"]);
        //     })
        // }
        // console.log(this.props.albumsAutoGallery)

        if (this.props.fetchedLocationClusters) {
            //const locationData = this.getLocation();
            const limeOptions = { color: 'black' };
            const userlocationsdata = this.selectData(this.state.userData);

            // Get album markers
            //console.log(this.props.album)
            //const markers = this.preprocess();
            //console.log(!(this.props.albumsAutoList.length === 0))
            var markers = [];
            if (!this.state.getMakers && this.props.fetchedAlbumsAutoGalleries) {
                // console.log("get markers", this.state.getMakers);
                // if (!(this.props.albumsAutoList.length === 0)) {
                //     this.props.albumsAutoList.map((dict) => {
                //         fetchAlbumsAutoGalleries(this.props.dispatch, dict["id"]);
                //     })
                // }

                //console.log("gallary", this.props.albumsAutoGalleries)


                const id = this.props.id;
                //console.log(id)
                markers = this.props.albumsAutoGalleries[id]["photos"].map((photos, index) => {
                    if (!(Object.keys(photos["geolocation_json"]).length === 0)) {
                        const loc = photos["geolocation_json"]["query"];
                        const source = `${serverAddress}/media/thumbnails_big/${photos["image_hash"]}`;
                        const title = photos["geolocation_json"]["search_text"];
                        if (loc[1]) {
                            return <Marker key={index} position={[loc[1], loc[0]]} title={title}
                                icon={new Icon({ iconUrl: source, iconSize: [40, 60], iconAnchor: [12, 41] })}>
                            </Marker>
                        }
                    }
                });
                // console.log("get markers", this.state.getMakers);
                // console.log("markers", markers)
                this.setState({ getMakers: !this.state.getMakers }, () => {
                    console.log("get markers", this.state.getMakers, this.props.id);
                });
                this.setState({ imgMarkers: markers })
                // console.log("get markers", this.state.getMakers, this.props.id);

            }


            var pos = userlocationsdata[0]
            if (userlocationsdata[0]) {
                if (this.props.showmap) {
                    pos = [-27.483603492593527, 153.0146598815918]
                } else {
                    // pos = markers[0].getLatLng()
                    pos = [this.props.albumsAutoGalleries[this.props.id]["gps_lat"], this.props.albumsAutoGalleries[this.props.id]["gps_lon"]]
                }
            }


            return (
                <div>
                    <div style={{ marginLeft: -5 }}>
                        <Map
                            ref={this.mapRef}
                            className="journey-tracking-map"
                            style={{
                                height: this.state.height - 300,
                            }}
                            onViewportChanged={this.onViewportChanged}
                            center={pos}
                            zoom={13}
                            {...options}
                        // ondblclick={this.addMarker}
                        // doubleClickZoom={false}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                url='https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
                                maxZoom="20"
                            />
                            {
                                this.state.getMakers &&
                                < MarkerClusterGroup zoomToBoundsOnClick={false} > {this.state.imgMarkers}</MarkerClusterGroup>
                            }
                            {this.props.showmap && this.state.getMakers &&
                                < Marker position={userlocationsdata[0]} icon={new Icon({ iconUrl: "https://unpkg.com/leaflet@1.4.0/dist/images/marker-icon.png", iconSize: [25, 41], iconAnchor: [12, 41] })}>
                                    {!this.props.dataFromParent &&
                                        <Popup>
                                            <div>
                                                Start of the trip!
                                                <br />
                                                <span><b>Trip Name</b></span><br /><input id="Trip Name" type="text" /><br /><br />
                                                <span><b>Description</b></span><br /><textarea id="Description" cols="25" rows="5"></textarea><br />
                                                <br /><input type="button" id="okBtn" value="Save" />
                                            </div>
                                        </Popup>
                                    }
                                </Marker>
                            }

                            {this.props.showmap &&
                                <Marker position={userlocationsdata.at(-1)} icon={new Icon({ iconUrl: "https://unpkg.com/leaflet@1.4.0/dist/images/marker-icon.png", iconSize: [25, 41], iconAnchor: [12, 41] })}>
                                    {!this.props.dataFromParent &&
                                        <Popup>
                                            <div>
                                                End of the trip!
                                                <br />
                                                <span><b>Trip Name</b></span><br /><input id="Trip Name" type="text" /><br /><br />
                                                <span><b>Description</b></span><br /><textarea id="Description" cols="25" rows="5"></textarea><br />
                                                <br /><input type="button" id="okBtn" value="Save" />
                                            </div>
                                        </Popup>
                                    }
                                </Marker>
                            }

                            {this.props.showmap &&
                                <Polyline pathOptions={limeOptions} positions={userlocationsdata} />
                            }
                        </Map>
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


MiniMapView = compose(
    connect(store => ({
        albumsPlaceList: store.albums.albumsPlaceList,
        albumsAutoList: store.albums.albumsAutoList,
        albumsAutoGalleries: store.albums.albumsAutoGalleries,
        fetchedAlbumsAutoGalleries: store.albums.fetchedAlbumsAutoGalleries,
        // fetchingAlbumsAutoGalleries: store.albums.fetchingAlbumsAutoGalleries,

        locationClusters: store.util.locationClusters,
        fetchingLocationClusters: store.util.fetchingLocationClusters,
        fetchedLocationClusters: store.util.fetchedLocationClusters,
        userList: store.util.userList,
        auth: store.auth,
        // photoDetails: store.photos,
    })),
    withTranslation()
)(MiniMapView);