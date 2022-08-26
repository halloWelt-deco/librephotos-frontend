/* eslint-disable */
import { Anchor, Image, Loader } from "@mantine/core";
import _ from "lodash";
import React, { Component } from "react";
import { withTranslation } from "react-i18next";
import { Map, Marker, TileLayer } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { connect } from "react-redux";
import { AutoSizer, Grid } from "react-virtualized";
import { compose } from "redux";
import { Map2 } from "tabler-icons-react";


import { fetchPlaceAlbumsList } from "../actions/albumsActions";
import { fetchLocationClusters } from "../actions/utilActions";
import { serverAddress } from "../api_client/apiClient";


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

        // let resizeDone = false;

        // // attempt resize 8 times; mapRef.current might be undefined
        // for (let i = 0; i < 8; i++) {
        //     setTimeout(() => {
        //         if (!resizeDone) {
        //             if (this.mapRef.current) {
        //                 const map = this.mapRef.current.leafletElement;
        //                 map.invalidateSize(true);
        //                 resizeDone = true;
        //             }
        //         }
        //     }, 1000 * (i + 1));
        // }
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

    preprocess() {
        const markers = this.props.locationClusters.map((loc, index) => {
            if (loc[0] !== 0) {
                return <Marker key={index} position={[loc[0], loc[1]]} title={loc[2]} />;
            }
            return <div />;
        });
        return markers;
    }

    render() {
        if (this.props.fetchedLocationClusters) {
            const markers = this.preprocess();

            return (
                <div>
                    <HeaderComponent
                        icon={<Map2 size={50} />}
                        title={this.props.t("Journey Map")}
                    /*fetching={this.props.fetchingAlbumsPlaceList}*/
                    />
                    <div style={{ marginLeft: -5 }}>
                        <Map
                            ref={this.mapRef}
                            className="journey-tracking-map"
                            style={{
                                height: this.state.height,
                            }}
                            center={[40, 0]}
                            zoom={2}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                url='https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
                                maxZoom="20"
                            />
                            <MarkerClusterGroup>{markers}</MarkerClusterGroup>
                            {/* <Marker position={center} icon={new Icon({ iconUrl: markerIconPng, iconSize: [25, 41], iconAnchor: [12, 41] })}>
                                <Popup>
                                    A pretty CSS3 popup. <br /> Easily customizable.
                                </Popup>
                            </Marker> */}
                        </Map>
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
    })),
    withTranslation()
)(JourneyMap);
