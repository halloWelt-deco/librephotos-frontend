/* eslint-disable */
import { Anchor, Image, Loader } from "@mantine/core";
import _ from "lodash";
import React, { Component } from "react";
import { withTranslation } from "react-i18next";
import { Map, Marker, TileLayer, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { Icon } from "leaflet"
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
                return <Marker key={index} position={[loc[0], loc[1]]} title={loc[2]} icon={new Icon({ iconUrl: source, iconSize: [40, 60], iconAnchor: [12, 41] })} >
                    {/* Require Fix: ReactDOM.render is no longer supported in React 18. Use createRoot instead. Until you switch to the new API, your app will behave as if it's running React 17.*/}
                    <Popup>
                        <div>
                            <div>
                                Id: {id}, title: {title}
                            </div>
                            <img
                                src={source}
                                width="150"
                                height="150"
                                alt="no img"
                            />
                        </div>
                    </Popup>
                </Marker>
            }
            return <div />;
        });
        return markers;
    }

    render() {
        if (this.props.fetchedLocationClusters) {
            const markers = this.preprocess();
            // var myIcon = L.divIcon({iconUrl: "myicon.png" });
            // console.log(`${serverAddress}/media/thumbnails_big/${photo.image_hash}`);
            // var myIcon = new L.DivIcon({
            //     className: 'icon-div',
            //     html: `<img src='http://leafletjs.com/examples/custom-icons/marker-icon.png'>`,
            // });
            // const serverAddress = "https://hallowelt.r18i.me"
            // console.log(this.state.visiblePlaceAlbums.length);
            // var source = "https://unpkg.com/leaflet@1.4.0/dist/images/marker-icon.png";
            // if (this.state.visiblePlaceAlbums.length > 0) {
            //     console.log(this.state.visiblePlaceAlbums[0]);
            //     console.log(this.state.visiblePlaceAlbums[0].cover_photos[0].image_hash);

            //     // myIcon = new L.DivIcon({
            //     //     className: 'icon-div',
            //     //     iconUrl: `${serverAddress}/media/thumbnails_big/${this.state.visiblePlaceAlbums[0].cover_photos[0].image_hash}`,
            //     //     // iconSize: [10, 10],
            //     //     // iconAnchor: [10, 10],
            //     // });

            //     source = `${serverAddress}/media/thumbnails_big/${this.state.visiblePlaceAlbums[0].cover_photos[0].image_hash}`;
            //     console.log(`'${serverAddress}/media/thumbnails_big/${this.state.visiblePlaceAlbums[0].cover_photos[0].image_hash}'`);
            // }
            // console.log(source);
            // console.log(myIcon);

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
