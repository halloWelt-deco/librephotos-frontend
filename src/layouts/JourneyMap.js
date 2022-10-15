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
import { Map2, Calendar, DotsVertical, Album, Home, MapSearch, Download, Browser, ExternalLink } from "tabler-icons-react";
import Lightbox from "react-image-lightbox";

import { fetchPlaceAlbumsList, fetchAutoAlbumsList, fetchAlbumsAutoGalleries } from "../actions/albumsActions";
import { fetchLocationClusters } from "../actions/utilActions";
import { serverAddress } from "../api_client/apiClient";

import { LEFT_MENU_WIDTH, TOP_MENU_HEIGHT } from "../ui-constants";
import { HeaderComponent } from "./albums/HeaderComponent";

const SIDEBAR_WIDTH = LEFT_MENU_WIDTH;
const CENTER_OF_MAP = [19.907267772280026, 77.76560783386232];
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
        // console.log(this.props.albumsAutoList.length)

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
                    <Popup>
                        <div>
                            <div>
                                Title: {title} <br />
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

    selectData(userD) {
        // Extract location from all of user's devices
        const locations = [];
        for (var points in userD["data"]) {
            locations.push([userD["data"][points].lat, userD["data"][points].lon]);
        }
        return locations;
    }

    addMarker = event => {
        const newmarker = this.state.addedMarkers
        newmarker.push(event.latlng)
        this.setState({ addedMarkers: newmarker })
    }

    removeMarker = (pos) => {
        this.setState({
            addedMarkers: this.state.addedMarkers.filter(coord => JSON.stringify(coord) !== JSON.stringify(pos))
        });
    };

    draggedMarker = event => {
        const latLng = event.target.getLatLng(); //get updated marker LatLng
        const markerIndex = event.target.options.marker_index; //get marker index

        this.setState(prevState => {
            const addedMarkers = [...prevState.addedMarkers];
            addedMarkers[markerIndex] = latLng;
            return { addedMarkers: addedMarkers };
        });
    }

    displayAlbum(id) {
        const map = this.mapRef.current.leafletElement;
        map.flyTo([this.props.albumsAutoGalleries[id]["gps_lat"], this.props.albumsAutoGalleries[id]["gps_lon"]], 10);

        this.setState({ selectedAlbum: true });
        const markers = this.props.albumsAutoGalleries[id]["photos"].map((photos, index) => {
            if (!(Object.keys(photos["geolocation_json"]).length === 0)) {
                const loc = photos["geolocation_json"]["query"];
                const source = `${serverAddress}/media/thumbnails_big/${photos["image_hash"]}`;
                const title = photos["geolocation_json"]["search_text"];
                if (loc[1]) {
                    return <Marker key={index} position={[loc[1], loc[0]]} title={title}
                        icon={new Icon({ iconUrl: source, iconSize: [40, 60], iconAnchor: [12, 41] })}>
                        <Popup>
                            <div>
                                <div>
                                    Title: {title} <br />
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
            title={"View Album"}
        >

            <Menu.Label>
                {"View Album"}
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
        // Get auto created albums
        if ((Object.keys(this.props.albumsAutoGalleries).length === 0)) {
            this.props.albumsAutoList.map((dict) => {
                fetchAlbumsAutoGalleries(this.props.dispatch, dict["id"]);
            })
            console.log(this.props.albumsAutoList);
        }

        if (this.props.fetchedLocationClusters) {
            const limeOptions = { color: 'black' };
            const userlocationsdata = this.selectData(this.state.userData);
            const user_name = this.props.auth.access.name
            const pass = "hallowelt";
            const url = "https://" + user_name + ":" + pass + "@track.rxh.codes/?lat=-27.482165484132235&lng=153.01487394999995&zoom=15&start=2022-09-12T14%3A00%3A00&end=2022-10-13T13%3A59%3A59&user=" + user_name + "&layers=last,line";

            // Get album markers
            const markers = this.preprocess();

            return (
                <div>
                    <HeaderComponent
                        icon={<Map2 size={50} />}
                        title={this.props.t("journeymap")}
                    />

                    <Group style={{ display: "flex", justifyContent: 'flex-start' }}>
                        <Group style={{ display: "flex", justifyContent: 'flex-start' }}>
                            <Button
                                variant="subtle"
                                onClick={() => {
                                    window.open(url, '_blank');
                                    // axios.get(url, {
                                    //     headers: {
                                    //         "Access-Control-Allow-Origin": "*",
                                    //         Authorization: `Bearer ${sessionStorage.getItem("auth-token")}`,
                                    //     }
                                    // }).then((response) => {
                                    //     const temp = window.URL.createObjectURL(new Blob([response.data]));
                                    //     const link = document.createElement('a');
                                    //     link.href = temp;
                                    //     link.setAttribute('download', 'location_data.html');
                                    //     document.body.appendChild(link);
                                    //     link.click();
                                    // });
                                }}
                                title={"Export Map"}
                            ><ExternalLink /></Button>
                        </Group>
                        <Group style={{ display: "flex", "marginLeft": "auto" }}>
                            <Button
                                variant="subtle"
                                onClick={() => {
                                    this.setState({ selectedAlbum: false });
                                    // "Center" of map
                                    this.mapRef.current.leafletElement.flyTo(CENTER_OF_MAP, 2);
                                }}
                                title={"Return Home View"}
                            ><Home /></Button>

                            {this.listAlbums()}
                        </Group>
                    </Group >

                    <div style={{ marginLeft: -5 }}>
                        <Map
                            ref={this.mapRef}
                            className="journey-tracking-map"
                            style={{
                                height: this.state.height - 90,
                            }}
                            onViewportChanged={this.onViewportChanged}
                            center={CENTER_OF_MAP}
                            zoom={2}
                            ondblclick={this.addMarker}
                            doubleClickZoom={false}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.osm.org/{z}/{x}/{y}.png"
                                maxZoom="20"
                            />
                            {!this.state.selectedAlbum && (
                                <MarkerClusterGroup>{markers}</MarkerClusterGroup>
                            )}

                            {!this.state.selectedAlbum && (
                                <Marker position={userlocationsdata[0]} icon={new Icon({ iconUrl: "https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|2ecc71&chf=a,s,ee00FFFF", iconSize: [25, 41], iconAnchor: [12, 41] })}>
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
                                <Marker position={userlocationsdata.at(-1)} icon={new Icon({ iconUrl: "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|e85141&chf=a,s,ee00FFFF", iconSize: [25, 41], iconAnchor: [12, 41] })}>
                                    <Popup>
                                        <div>
                                            End of the trip!
                                            <br />
                                            <span><b>Trip Name</b></span><br /><input id="Trip Name" type="text" /><br /><br />
                                            <span><b>Description</b></span><br /><textarea id="Description" cols="25" rows="5"></textarea><br />
                                            <br /><input type="button" id="okBtn" value="Save" />
                                        </div>
                                    </Popup>
                                </Marker>)
                            }

                            {!this.state.selectedAlbum &&
                                <Polyline pathOptions={limeOptions} positions={userlocationsdata} />
                            }

                            {!this.state.selectedAlbum && (
                                this.state.addedMarkers.map((pos, idx) =>
                                    <Marker key={`marker-${idx}`} marker_index={idx} position={pos} draggable={true} onDragend={this.draggedMarker}>
                                        <Popup >
                                            <div style={{ width: "max-content" }}>
                                                Coordinates:
                                                <br />
                                                Lat: {pos.lat},
                                                <br />
                                                Lng: {pos.lng}
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
                        <div
                            style={{
                                font: "italic small-caps bold 16px/2 cursive", "z-index": "999", padding: "10px", "fontWeight": "700"
                            }}
                        > DoubleTap to Add and Drag Maker</div>

                        {this.state.lightboxShow && (
                            < Lightbox
                                mainSrc={this.state.currentImgSrc}
                                imageLoadErrorMessage=""
                                onCloseRequest={() => this.setState({ lightboxShow: false })}
                            />
                        )}
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

        locationClusters: store.util.locationClusters,
        fetchingLocationClusters: store.util.fetchingLocationClusters,
        fetchedLocationClusters: store.util.fetchedLocationClusters,
        userList: store.util.userList,
        auth: store.auth,
    })),
    withTranslation()
)(JourneyMap);