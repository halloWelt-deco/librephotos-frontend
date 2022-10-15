/* eslint-disable */
import { Loader, Modal } from "@mantine/core";
import _ from "lodash";
import React, { Component, useEffect } from "react";
import { withTranslation } from "react-i18next";
import { Map, Marker, TileLayer, Popup, Polyline } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { Icon } from "leaflet"
import { connect } from "react-redux";
import { compose } from "redux";
import "react-datepicker/dist/react-datepicker.css";

import { fetchPlaceAlbumsList, fetchAutoAlbumsList, fetchAlbumsAutoGalleries } from "../actions/albumsActions";
import { fetchLocationClusters } from "../actions/utilActions";
import { serverAddress } from "../api_client/apiClient";
import { LEFT_MENU_WIDTH, TOP_MENU_HEIGHT } from "../ui-constants";

export class MiniMapView extends Component {
    state = {
        locationClusters: [],
        width: window.innerWidth,
        height: window.innerHeight - TOP_MENU_HEIGHT - 60,
        userData: [],
        //date: new Date(),
        getMakers: false,
        imgMarkers: [],
        pos: [1, 1]
    };

    constructor(props) {
        super(props);
        this.mapRef = React.createRef();
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
            fetchAlbumsAutoGalleries(this.props.dispatch, this.props.id);
        }

        // const userName = this.props.auth.access.name
        const userName = "user"; // "Mock data"

        const data = require("../owntracks-data/" + userName + "_data.json");
        this.setState({ userData: data });
    }

    selectData(userD) {
        // Extract location from all of user's devices
        const locations = [];
        for (var points in userD["data"]) {
            locations.push([userD["data"][points].lat, userD["data"][points].lon]);
        }
        return locations;
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

        if (this.props.fetchedLocationClusters) {
            const limeOptions = { color: 'black' };
            if (this.state.userData.length !== 0) {
                const userlocationsdata = this.selectData(this.state.userData);
                var markers = [];

                if (this.props.albumsAutoGalleries[this.props.id] !== undefined) {
                    if (!this.state.getMakers && this.props.fetchedAlbumsAutoGalleries) {
                        const id = this.props.id;
                        if (Object.keys(this.props.albumsAutoGalleries[id]).length !== 0) {
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

                            this.setState({ getMakers: !this.state.getMakers })
                            this.setState({ imgMarkers: markers })

                            if (this.props.modal) {
                                console.log("user", userlocationsdata[0]);
                            }
                            if (userlocationsdata[0]) {
                                if (this.props.showmap) {
                                    this.setState({ pos: [-27.483603492593527, 153.0146598815918] })
                                } else {
                                    this.setState({ pos: [this.props.albumsAutoGalleries[this.props.id]["gps_lat"], this.props.albumsAutoGalleries[this.props.id]["gps_lon"]] })
                                }
                            }

                            if (this.props.modal) {
                                console.log(this.state.pos);
                            }
                        }
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
                                center={this.state.pos}
                                zoom={13}
                                {...options}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                    url='https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
                                    maxZoom="20"
                                />
                                {this.state.getMakers &&
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
}


MiniMapView = compose(
    connect(store => ({
        albumsPlaceList: store.albums.albumsPlaceList,
        albumsAutoList: store.albums.albumsAutoList,
        albumsAutoGalleries: store.albums.albumsAutoGalleries,
        fetchedAlbumsAutoGalleries: store.albums.fetchedAlbumsAutoGalleries,
        locationClusters: store.util.locationClusters,
        fetchingLocationClusters: store.util.fetchingLocationClusters,
        fetchedLocationClusters: store.util.fetchedLocationClusters,
        auth: store.auth,
    })),
    withTranslation()
)(MiniMapView);