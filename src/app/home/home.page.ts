import { Component } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';

declare var google: any;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  latitude: number;
  longitude: number;
  map: any;
  mapElementRef: any;
  service: any;
  nearestHospitals: any[];
  nearestCount: number;
  display: any;
  ratingFilter: number;

  constructor() {
    this.latitude = 0;
    this.longitude = 0;
    this.nearestHospitals = [];
    this.nearestCount = 0;
    this.ratingFilter = 0; // Initialize with no rating filter
  }

  async getPosition() {
    const coordinates = await Geolocation.getCurrentPosition();
    this.latitude = coordinates.coords.latitude;
    this.longitude = coordinates.coords.longitude;
  }

  async loadMap() {
    await this.getPosition();
    const mapOptions = {
      center: { lat: this.latitude, lng: this.longitude },
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
    };
    this.mapElementRef = document.getElementById('map');
    this.map = new google.maps.Map(this.mapElementRef, mapOptions);
    const marker = this.addMarker(this.latitude, this.longitude, 'Current Location', '');
    this.service = new google.maps.places.PlacesService(this.map);
    this.GooglePlacesNearbySearch(this.latitude, this.longitude);
    this.display = new google.maps.DirectionsRenderer();
  }

  addMarker(latitude: number, longitude: number, placeName: string, image: any) {
    const marker = new google.maps.Marker({
      position: { lat: latitude, lng: longitude },
    map: this.map,
    icon: {
      url: image,
      scaledSize: new google.maps.Size(32, 32), 
    },
  });

    const myInfowindow = new google.maps.InfoWindow({
      content: "<div style='color: #000; background: #FFF'>" + placeName + "<div>",
    });

    google.maps.event.addListener(marker, 'click', () => {
      myInfowindow.open(this.map, marker);
    });

    return marker;
  }

  GooglePlacesNearbySearch(latitude: number, longitude: number) {
    const request = {
      location: { lat: latitude, lng: longitude },
      rankBy: google.maps.places.RankBy.DISTANCE,
      keyword: 'hospital',
    };

    this.service.nearbySearch(request, (results: any, status: any) => {
      console.table(results);
      console.log(status);

      if (status === google.maps.places.PlacesServiceStatus.OK) {
        for (let i = 0; i < results.length; i++) {
          const place = results[i];
          if (!place.geometry || !place.geometry.location) return;

          // Check if the place rating is equal to or higher than the filter rating
          if (place.rating >= this.ratingFilter || this.ratingFilter === 0) {
            this.nearestHospitals.push(place);
            this.addMarker(place.geometry.location.lat(), place.geometry.location.lng(), place.name, "https://cdn.pixabay.com/photo/2020/04/10/13/14/marker-5025759_1280.png");
          }
        }
      }
    });
  }

  RouteToNextNearest() {
    const index = this.nearestCount % this.nearestHospitals.length;
    const nearestHospital = this.nearestHospitals[index];
    const nearestHospitalLat = nearestHospital.geometry.location.lat();
    const nearestHospitalLng = nearestHospital.geometry.location.lng();
    this.drawRoute(this.latitude, this.longitude, nearestHospitalLat, nearestHospitalLng);
    this.nearestCount++;
  }

  drawRoute(startLat: number, startLng: number, endLat: number, endLng: number) {
    this.service = new google.maps.DirectionsService();
    this.display.setMap(this.map);
    const request = {
      origin: { lat: startLat, lng: startLng },
      destination: { lat: endLat, lng: endLng },
      travelMode: google.maps.TravelMode.DRIVING,
    };
    this.service.route(request, (result: any, status: any) => {
      if (status === 'OK') {
        this.display.setDirections(result);
      }
    });
  }

  filterHospitalsByRating(rating: number) {
    this.ratingFilter = rating;
    this.nearestHospitals = []; // Clear previous filtered hospitals
    this.GooglePlacesNearbySearch(this.latitude, this.longitude);
  }

  async ngOnInit() {
    await this.loadMap();
  }
}