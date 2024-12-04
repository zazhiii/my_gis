<template>
  <div id="app">
    <el-container>
      <el-aside width="350px">
        <div class="layer-control">
          <el-color-picker v-model="layerConfig.districts.color" size="small"
            @change="updateLayerColor('districts')"></el-color-picker>
          <el-checkbox v-model="layerConfig.districts.checked" @change="toggleLayer('districts')">和平区</el-checkbox>
        </div>
        <div class="layer-control">
          <el-color-picker v-model="layerConfig.buildings.color" size="small"
            @change="updateLayerColor('buildings')"></el-color-picker>
          <el-checkbox v-model="layerConfig.buildings.checked" @change="toggleLayer('buildings')">建筑物</el-checkbox>
        </div>
        <div class="layer-control">
          <el-color-picker v-model="layerConfig.greenbelts.color" size="small"
            @change="updateLayerColor('greenbelts')"></el-color-picker>
          <el-checkbox v-model="layerConfig.greenbelts.checked" @change="toggleLayer('greenbelts')">
            绿地（矢量数据）
            <span v-if="layerConfig.greenbelts.checked">{{ layerConfig.greenbelts.area.toFixed(2) }} 平方米</span>
          </el-checkbox>
        </div>
        <div class="layer-control">
          <el-color-picker v-model="layerConfig.greenbeltsRS.color" size="small"
            @change="updateLayerColor('greenbelts')"></el-color-picker>
          <el-checkbox v-model="layerConfig.greenbeltsRS.checked" @change="toggleLayer('greenbeltsRS')">
            绿地（遥感数据）
            <span v-if="layerConfig.greenbeltsRS.checked">{{ layerConfig.greenbeltsRS.area.toFixed(2) }} 平方米</span>
          </el-checkbox>
        </div>
        <div class="layer-control">
          <el-color-picker v-model="layerConfig.intersections.color" size="small"
            @change="updateLayerColor('intersections')"></el-color-picker>
          <el-checkbox v-model="layerConfig.intersections.checked" @change="toggleLayer('intersections')">
            绿地重叠区域
          </el-checkbox>
        </div>
        <div class="layer-control">
          <el-color-picker v-model="layerConfig.roads.color" size="small"
            @change="updateLayerColor('roads')"></el-color-picker>
          <el-checkbox v-model="layerConfig.roads.checked" @change="toggleLayer('roads')">道路</el-checkbox>
        </div>
        <div class="layer-control">
          <el-color-picker v-model="layerConfig.waters.color" size="small"
            @change="updateLayerColor('waters')"></el-color-picker>
          <el-checkbox v-model="layerConfig.waters.checked" @change="toggleLayer('waters')">水域</el-checkbox>
        </div>
        <div class="base-map-control">
          <el-radio-group v-model="currentBaseMap" @change="changeBaseMap">
            <el-radio label="osm">OpenStreetMap</el-radio><br>
            <el-radio label="satellite">卫星图</el-radio><br>
            <el-radio label="terrain">地形图</el-radio><br>
            <el-radio label="dark">暗黑模式</el-radio><br>
            <el-radio label="light">浅色模式</el-radio><br>
            <el-radio label="none">无底图</el-radio>
          </el-radio-group>
        </div>
        <el-button @click="clearHighlight" style="margin: 20px 0 20px 0;">清除高亮</el-button>
        <el-input v-model="searchKeyword" placeholder="搜索" @keyup.enter.native="searchAndHighlight(searchKeyword)">
        </el-input>
        <el-button @click="showIntersection" style="margin: 20px 0 20px 0;">叠加绿地</el-button>
      </el-aside>
      <el-main>
        <div id="map" style="width: 100%; height: 700px; float: right;"></div>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import L from 'leaflet';
import {
  getBuilding,
  getGreenBelt,
  getDistrict,
  getRoad,
  getGreenBeltRS,
  getIntersection,
  getIntersectionArea,
  getGreenbeltArea,
  getGreenbeltRSArea
} from './api/data';

export default {
  name: 'App',
  data() {
    return {
      // 图层配置
      // geoJSON: 数据, layer: 图层对象, color: 颜色, checked: 是否显示
      layerConfig: {
        districts: { geoJSON: [], layerGroup: null, color: '#996699', checked: true },
        waters: { geoJSON: [], layerGroup: null, color: '#6699cc', checked: true },
        buildings: { geoJSON: [], layerGroup: null, color: '#cc8866', checked: true },
        roads: { geoJSON: [], layerGroup: null, color: '#999999', checked: true },
        greenbelts: { geoJSON: [], layerGroup: null, color: '#88aa88', checked: true, area: 0 },
        greenbeltsRS: { geoJSON: [], layerGroup: null, color: '#88aa88', checked: true, area: 0 },
        intersections: { geoJSON: [], layerGroup: null, color: '#ff0000', checked: false, area: 0 },
      },
      // 地图对象
      map: {},
      // 当前底图
      currentBaseMap: 'osm',
      // 底图
      baseMaps: {
        osm: null,
        satellite: null,
        terrain: null,
        dark: null,
        light: null,
        none: null
      },
      // 搜索关键字
      searchKeyword: '',
    }
  },
  mounted() {
    this.init();
  },
  methods: {
    // 初始化
    async init() {
      // 初始化地图
      this.map = L.map('map').setView([39.117, 117.214], 14);
      // 初始化底图
      this.baseMaps.osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      });
      this.baseMaps.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      });
      this.baseMaps.terrain = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)'
      });
      this.baseMaps.dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      });
      this.baseMaps.light = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      });
      this.baseMaps.none = L.tileLayer('');
      // 添加默认底图
      this.baseMaps.osm.addTo(this.map);

      // 获取数据
      const { data: buildings } = await getBuilding();
      this.layerConfig.buildings.geoJSON = buildings;
      const { data: roads } = await getRoad();
      this.layerConfig.roads.geoJSON = roads;
      const { data: districts } = await getDistrict();
      this.layerConfig.districts.geoJSON = districts;
      const { data: greenbelts } = await getGreenBelt();
      this.layerConfig.greenbelts.geoJSON = greenbelts;
      const { data: intersections } = await getIntersection();
      this.layerConfig.intersections.geoJSON = intersections;
      const { data: area } = await getIntersectionArea();
      this.layerConfig.intersections.area = area;
      const { data: greenbeltsRS } = await getGreenBeltRS();
      this.layerConfig.greenbeltsRS.geoJSON = greenbeltsRS;

      getGreenbeltArea().then(({ data }) => {
        this.layerConfig.greenbelts.area = data;
      });
      getGreenbeltRSArea().then(({ data }) => {
        this.layerConfig.greenbeltsRS.area = data;
      });


      // 添加图层
      Object.keys(this.layerConfig).forEach(layerName => {
        const layerConfig = this.layerConfig[layerName];
        // 创建图层
        layerConfig.layerGroup = this.createLayer(layerConfig.geoJSON, {
          color: layerConfig.color,
          weight: 2,
          opacity: 1,
          fillOpacity: 0.5
        });
        // 添加到地图
        if (layerConfig.checked) {
          layerConfig.layerGroup.addTo(this.map);
        }
      });
    },
    // 创建图层
    // data: geoJSON数据, style: 样式
    // 返回图层组
    async showIntersection() {
      this.layerConfig.intersections.checked = true;
      this.toggleLayer('intersections');
      // this.highlightFeature(this.layerConfig.intersections.layerGroup);
      this.layerConfig.intersections.layerGroup.eachLayer(layer => {
        this.highlightFeature(layer);
      });
      this.layerConfig.intersections.layerGroup
      this.toggleLayer('intersections');
      this.$message.success('叠加绿地成功, 面积为' + this.layerConfig.intersections.area.toFixed(2) + '平方米');
    },
    createLayer(data, style) {
      // data.map 将遍历数据数组中的每个元素(item)
      // 对每个元素执行回调函数,生成一个新的图层对象
      // 最终返回一个包含所有图层对象的新数组
      // 这些图层对象会被L.layerGroup()合并成一个图层组
      return L.layerGroup(data.map(item => {
        const geoJSON = JSON.parse(item.geom);
        const layer = L.geoJSON(geoJSON, {
          style: style,
          // 点击事件
          onEachFeature: (feature, layer) => {
            layer.on('click', (e) => {
              this.highlightFeature(e.target);
            });
            layer.bindPopup(`<b>${item.name}</b>`);
          }
        });
        layer.name = item.name;
        return layer;
      }));
    },
    highlightFeature(layer) {
      layer.setStyle({
        weight: 5,
        color: '#4BFFF0',
        dashArray: '',
        fillOpacity: 0.7
      });
      this.highlightedLayer = layer;
    },
    clearHighlight() {
      Object.keys(this.layerConfig).forEach(layerName => {
        this.updateLayerColor(layerName);
      });
    },
    // 切换图层
    toggleLayer(layerName) {
      const layerConfig = this.layerConfig[layerName];
      // 如果图层被选中
      if (layerConfig.checked) {
        // 如果图层不存在 创建图层
        if (!layerConfig.layerGroup) {
          layerConfig.layerGroup = this.createLayer(layerConfig.geoJSON, {
            color: layerConfig.color,
            weight: 2,
            opacity: 1,
            fillOpacity: 0.5
          });
        }
        // 添加到地图
        layerConfig.layerGroup.addTo(this.map);
      } else {
        // 如果图层存在 移除图层
        if (layerConfig.layerGroup) {
          this.map.removeLayer(layerConfig.layerGroup);
        }
      }
    },
    // 更新图层颜色
    updateLayerColor(layerName) {
      const layerConfig = this.layerConfig[layerName];
      if (layerConfig.layerGroup) {
        layerConfig.layerGroup.eachLayer(layer => {
          layer.setStyle({
            color: layerConfig.color,
            weight: 2,
            opacity: 1,
            fillOpacity: 0.5
          });
        });
      }
    },
    changeBaseMap(newBaseMap) {
      Object.values(this.baseMaps).forEach(baseMap => {
        if (this.map.hasLayer(baseMap)) {
          this.map.removeLayer(baseMap);
        }
      });
      if (newBaseMap !== 'none') {
        this.baseMaps[newBaseMap].addTo(this.map);
      }
    },
    // 搜索并高亮
    searchAndHighlight(keyword) {
      this.clearHighlight();
      if (!keyword) {
        this.$message.warning('请输入搜索关键字');
        return;
      }
      let found = false;
      // 遍历图层配置(layerConfig)中的每个图层组
      Object.keys(this.layerConfig).forEach(layerName => {
        const layerConfig = this.layerConfig[layerName];
        // 如果图层被选中
        if (layerConfig.checked) {
          layerConfig.layerGroup.eachLayer(layer => {
            if (String(layer.name).includes(keyword)) {
              console.log("搜索结果：" + layer);

              this.highlightFeature(layer);
              found = true;
            }
          })
        }
      });
      if (!found) {
        this.$message.warning('未找到匹配的要素');
      }
    }
  },
};
</script>

<style>
.el-aside {
  padding: 20px;
}

.el-color-picker {
  margin-right: 10px;
}

.layer-control {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.base-map-control {
  margin-top: 20px;
}

.el-button {
  margin-top: 20px;
  width: 100%;
}
</style>