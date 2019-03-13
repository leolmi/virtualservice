webpackJsonp(["main"],{

/***/ "./src/$$_lazy_route_resource lazy recursive":
/***/ (function(module, exports) {

function webpackEmptyAsyncContext(req) {
	// Here Promise.resolve().then() is used instead of new Promise() to prevent
	// uncatched exception popping up in devtools
	return Promise.resolve().then(function() {
		throw new Error("Cannot find module '" + req + "'.");
	});
}
webpackEmptyAsyncContext.keys = function() { return []; };
webpackEmptyAsyncContext.resolve = webpackEmptyAsyncContext;
module.exports = webpackEmptyAsyncContext;
webpackEmptyAsyncContext.id = "./src/$$_lazy_route_resource lazy recursive";

/***/ }),

/***/ "./src/app/app.animations.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return fadeAnimation; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_animations__ = __webpack_require__("./node_modules/@angular/animations/esm5/animations.js");

var fadeAnimation = Object(__WEBPACK_IMPORTED_MODULE_0__angular_animations__["m" /* trigger */])('fadeAnimation', [
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_animations__["l" /* transition */])('* => *', [
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_animations__["h" /* query */])(':enter', [
            Object(__WEBPACK_IMPORTED_MODULE_0__angular_animations__["k" /* style */])({ opacity: 0 }),
            Object(__WEBPACK_IMPORTED_MODULE_0__angular_animations__["e" /* animate */])('2s', Object(__WEBPACK_IMPORTED_MODULE_0__angular_animations__["k" /* style */])({ opacity: 1 }))
        ], { optional: true })
    ])
]);


/***/ }),

/***/ "./src/app/app.component.html":
/***/ (function(module, exports) {

module.exports = "\n<!-- MAIN -->\n<main [@fadeAnimation]=\"getRouterOutletState(o)\" fxLayout=\"column\" fxFlex>\n  <!-- TOOLBAR - HEADER -->\n  <toolbar-header></toolbar-header>\n  <!-- PAGE -->\n  <router-outlet #o=\"outlet\"></router-outlet>\n</main>\n<!-- IDLE -->\n<div class=\"app-idle\" [ngClass]=\"{'active':u.idle.active}\">\n  <div class=\"working-container\">\n    <div class=\"working\"></div>\n  </div>\n  <p>{{u.idle.message}}</p>\n</div>\n<!-- ERRORS -->\n<div *ngIf=\"u.err\" (click)=\"hideError()\" class=\"app-error\" fxLayout=\"row\" fxLayoutAlign=\"center center\">\n  <span>{{u.err}}</span>\n</div>\n<!-- FOOTER -->\n<div class=\"app-footer\" fxLayout=\"row\" fxLayoutAlign=\"center center\">\n  <span>virtual service v.{{u.app.version}} </span>\n</div>\n<!-- DIALOG -->\n<vs-dialog></vs-dialog>"

/***/ }),

/***/ "./src/app/app.component.scss":
/***/ (function(module, exports) {

module.exports = ".app-footer {\n  position: absolute;\n  bottom: 0;\n  left: 0;\n  width: 100vw;\n  height: 24px;\n  overflow: hidden;\n  z-index: 10;\n  font-family: monospace;\n  font-size: .8em;\n  pointer-events: none; }\n\n.app-error {\n  position: absolute;\n  bottom: 0;\n  left: 0;\n  width: 100vw;\n  padding: 20px;\n  font-family: monospace;\n  z-index: 20;\n  background-color: orangered;\n  cursor: pointer; }\n"

/***/ }),

/***/ "./src/app/app.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AppComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__app_animations__ = __webpack_require__("./src/app/app.animations.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_router__ = __webpack_require__("./node_modules/@angular/router/esm5/router.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__services_auth_service__ = __webpack_require__("./src/app/services/auth.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__services_util_service__ = __webpack_require__("./src/app/services/util.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};





var AppComponent = /** @class */ (function () {
    function AppComponent(router, auth, route, u) {
        this.router = router;
        this.auth = auth;
        this.route = route;
        this.u = u;
        this.version = '0.0.1';
        this.toolbar = false;
        this.u.idle.start('initializing...');
        // route.data.subscribe((data: any) => this.toolbar = (data || {}).toolbar);
    }
    AppComponent.prototype.navigate = function (target) {
        this.u.idle.stop();
        this.router.navigate([target]);
    };
    AppComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.auth.checkAuth().then(function () { return _this.navigate('list'); }, function (err) { return _this.navigate('login'); });
    };
    AppComponent.prototype.getRouterOutletState = function (outlet) {
        return outlet.isActivated ? outlet.activatedRoute : '';
    };
    AppComponent.prototype.hideError = function () {
        this.u.err = null;
    };
    AppComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Component"])({
            selector: 'app-root',
            template: __webpack_require__("./src/app/app.component.html"),
            styles: [__webpack_require__("./src/app/app.component.scss")],
            animations: [__WEBPACK_IMPORTED_MODULE_1__app_animations__["a" /* fadeAnimation */]]
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_2__angular_router__["c" /* Router */],
            __WEBPACK_IMPORTED_MODULE_3__services_auth_service__["a" /* AuthService */],
            __WEBPACK_IMPORTED_MODULE_2__angular_router__["a" /* ActivatedRoute */],
            __WEBPACK_IMPORTED_MODULE_4__services_util_service__["a" /* UtilService */]])
    ], AppComponent);
    return AppComponent;
}());



/***/ }),

/***/ "./src/app/app.module.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AppModule; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_platform_browser__ = __webpack_require__("./node_modules/@angular/platform-browser/esm5/platform-browser.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_platform_browser_animations__ = __webpack_require__("./node_modules/@angular/platform-browser/esm5/animations.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__angular_forms__ = __webpack_require__("./node_modules/@angular/forms/esm5/forms.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__app_component__ = __webpack_require__("./src/app/app.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__app_router__ = __webpack_require__("./src/app/app.router.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6_angular_webstorage_service__ = __webpack_require__("./node_modules/angular-webstorage-service/bundles/angular-webstorage-service.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__angular_common_http__ = __webpack_require__("./node_modules/@angular/common/esm5/http.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8_ngx_clipboard__ = __webpack_require__("./node_modules/ngx-clipboard/dist/ngx-clipboard.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__services_auth_service__ = __webpack_require__("./src/app/services/auth.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__services_interceptor_service__ = __webpack_require__("./src/app/services/interceptor.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11__services_interaction_service__ = __webpack_require__("./src/app/services/interaction.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_12__services_util_service__ = __webpack_require__("./src/app/services/util.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_13__services_document_service__ = __webpack_require__("./src/app/services/document.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_14__services_toolbar_service__ = __webpack_require__("./src/app/services/toolbar.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_15__pages_login_login_component__ = __webpack_require__("./src/app/pages/login/login.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_16__pages_editor_editor_component__ = __webpack_require__("./src/app/pages/editor/editor.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_17__pages_list_list_component__ = __webpack_require__("./src/app/pages/list/list.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_18__pages_monitor_monitor_component__ = __webpack_require__("./src/app/pages/monitor/monitor.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_19__angular_flex_layout__ = __webpack_require__("./node_modules/@angular/flex-layout/esm5/flex-layout.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_20__components_textbox_container_textbox_container_component__ = __webpack_require__("./src/app/components/textbox-container/textbox-container.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_21_ng2_codemirror__ = __webpack_require__("./node_modules/ng2-codemirror/lib/index.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_21_ng2_codemirror___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_21_ng2_codemirror__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_22__components_dialog_dialog_host_directive__ = __webpack_require__("./src/app/components/dialog/dialog-host.directive.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_23__components_tab_tab_button_directive__ = __webpack_require__("./src/app/components/tab/tab-button.directive.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_24__components_tab_tab_content_directive__ = __webpack_require__("./src/app/components/tab/tab-content.directive.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_25__components_expression_scope_help_expression_scope_help_component__ = __webpack_require__("./src/app/components/expression-scope-help/expression-scope-help.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_26__components_call_rule_editor_call_rule_editor_component__ = __webpack_require__("./src/app/components/call-rule-editor/call-rule-editor.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_27__components_dialog_dialog_component__ = __webpack_require__("./src/app/components/dialog/dialog.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_28__components_toolbar_header_toolbar_header_component__ = __webpack_require__("./src/app/components/toolbar-header/toolbar-header.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_29__angular_material__ = __webpack_require__("./node_modules/@angular/material/esm5/material.es5.js");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};









// SERVICES






// PAGES




// COMPONENTS










// MATERIAL

var AppModule = /** @class */ (function () {
    function AppModule() {
    }
    AppModule = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_2__angular_core__["NgModule"])({
            declarations: [
                __WEBPACK_IMPORTED_MODULE_4__app_component__["a" /* AppComponent */],
                __WEBPACK_IMPORTED_MODULE_15__pages_login_login_component__["a" /* LoginComponent */],
                __WEBPACK_IMPORTED_MODULE_16__pages_editor_editor_component__["a" /* EditorComponent */],
                __WEBPACK_IMPORTED_MODULE_20__components_textbox_container_textbox_container_component__["a" /* TextboxContainerComponent */],
                __WEBPACK_IMPORTED_MODULE_23__components_tab_tab_button_directive__["a" /* TabButtonDirective */],
                __WEBPACK_IMPORTED_MODULE_24__components_tab_tab_content_directive__["a" /* TabContentDirective */],
                __WEBPACK_IMPORTED_MODULE_25__components_expression_scope_help_expression_scope_help_component__["a" /* ExpressionScopeHelpComponent */],
                __WEBPACK_IMPORTED_MODULE_26__components_call_rule_editor_call_rule_editor_component__["a" /* CallRuleEditorComponent */],
                __WEBPACK_IMPORTED_MODULE_22__components_dialog_dialog_host_directive__["a" /* DialogHost */],
                __WEBPACK_IMPORTED_MODULE_27__components_dialog_dialog_component__["a" /* DialogComponent */],
                __WEBPACK_IMPORTED_MODULE_28__components_toolbar_header_toolbar_header_component__["a" /* ToolbarHeaderComponent */],
                __WEBPACK_IMPORTED_MODULE_17__pages_list_list_component__["a" /* ListComponent */],
                __WEBPACK_IMPORTED_MODULE_18__pages_monitor_monitor_component__["a" /* MonitorComponent */]
            ],
            imports: [
                __WEBPACK_IMPORTED_MODULE_5__app_router__["a" /* AppRoutingModule */],
                __WEBPACK_IMPORTED_MODULE_0__angular_platform_browser__["a" /* BrowserModule */],
                __WEBPACK_IMPORTED_MODULE_1__angular_platform_browser_animations__["a" /* BrowserAnimationsModule */],
                __WEBPACK_IMPORTED_MODULE_3__angular_forms__["FormsModule"],
                __WEBPACK_IMPORTED_MODULE_3__angular_forms__["ReactiveFormsModule"],
                __WEBPACK_IMPORTED_MODULE_19__angular_flex_layout__["a" /* FlexLayoutModule */],
                __WEBPACK_IMPORTED_MODULE_6_angular_webstorage_service__["b" /* StorageServiceModule */],
                __WEBPACK_IMPORTED_MODULE_8_ngx_clipboard__["a" /* ClipboardModule */],
                __WEBPACK_IMPORTED_MODULE_7__angular_common_http__["c" /* HttpClientModule */],
                __WEBPACK_IMPORTED_MODULE_21_ng2_codemirror__["CodemirrorModule"],
                __WEBPACK_IMPORTED_MODULE_29__angular_material__["a" /* MatButtonModule */],
                __WEBPACK_IMPORTED_MODULE_29__angular_material__["c" /* MatCheckboxModule */],
                __WEBPACK_IMPORTED_MODULE_29__angular_material__["f" /* MatToolbarModule */],
                __WEBPACK_IMPORTED_MODULE_29__angular_material__["d" /* MatInputModule */],
                __WEBPACK_IMPORTED_MODULE_29__angular_material__["b" /* MatCardModule */],
                __WEBPACK_IMPORTED_MODULE_29__angular_material__["e" /* MatMenuModule */]
            ],
            providers: [
                { provide: __WEBPACK_IMPORTED_MODULE_7__angular_common_http__["a" /* HTTP_INTERCEPTORS */], useClass: __WEBPACK_IMPORTED_MODULE_10__services_interceptor_service__["a" /* InterceptorService */], multi: true },
                __WEBPACK_IMPORTED_MODULE_9__services_auth_service__["a" /* AuthService */],
                __WEBPACK_IMPORTED_MODULE_9__services_auth_service__["b" /* CanActivateAuth */],
                __WEBPACK_IMPORTED_MODULE_11__services_interaction_service__["a" /* InteractionService */],
                __WEBPACK_IMPORTED_MODULE_12__services_util_service__["a" /* UtilService */],
                __WEBPACK_IMPORTED_MODULE_14__services_toolbar_service__["a" /* ToolbarService */],
                __WEBPACK_IMPORTED_MODULE_13__services_document_service__["a" /* DocumentService */]
            ],
            bootstrap: [__WEBPACK_IMPORTED_MODULE_4__app_component__["a" /* AppComponent */]],
            entryComponents: [
                __WEBPACK_IMPORTED_MODULE_26__components_call_rule_editor_call_rule_editor_component__["a" /* CallRuleEditorComponent */]
            ]
        })
    ], AppModule);
    return AppModule;
}());



/***/ }),

/***/ "./src/app/app.router.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AppRoutingModule; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_router__ = __webpack_require__("./node_modules/@angular/router/esm5/router.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__pages_login_login_component__ = __webpack_require__("./src/app/pages/login/login.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__services_auth_service__ = __webpack_require__("./src/app/services/auth.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__pages_editor_editor_component__ = __webpack_require__("./src/app/pages/editor/editor.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__pages_list_list_component__ = __webpack_require__("./src/app/pages/list/list.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__pages_monitor_monitor_component__ = __webpack_require__("./src/app/pages/monitor/monitor.component.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};







var routes = [
    { path: '', redirectTo: '/', pathMatch: 'full' },
    { path: 'login', component: __WEBPACK_IMPORTED_MODULE_2__pages_login_login_component__["a" /* LoginComponent */] },
    { path: 'list', component: __WEBPACK_IMPORTED_MODULE_5__pages_list_list_component__["a" /* ListComponent */], canActivate: [__WEBPACK_IMPORTED_MODULE_3__services_auth_service__["b" /* CanActivateAuth */]] },
    { path: 'editor/:id', component: __WEBPACK_IMPORTED_MODULE_4__pages_editor_editor_component__["a" /* EditorComponent */], canActivate: [__WEBPACK_IMPORTED_MODULE_3__services_auth_service__["b" /* CanActivateAuth */]] },
    { path: 'monitor/:id', component: __WEBPACK_IMPORTED_MODULE_6__pages_monitor_monitor_component__["a" /* MonitorComponent */], canActivate: [__WEBPACK_IMPORTED_MODULE_3__services_auth_service__["b" /* CanActivateAuth */]] }
];
var AppRoutingModule = /** @class */ (function () {
    function AppRoutingModule() {
    }
    AppRoutingModule = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["NgModule"])({
            imports: [__WEBPACK_IMPORTED_MODULE_1__angular_router__["d" /* RouterModule */].forRoot(routes, { useHash: true })],
            exports: [__WEBPACK_IMPORTED_MODULE_1__angular_router__["d" /* RouterModule */]],
            providers: []
        })
    ], AppRoutingModule);
    return AppRoutingModule;
}());



/***/ }),

/***/ "./src/app/components/call-rule-editor/call-rule-editor.component.html":
/***/ (function(module, exports) {

module.exports = "<div class=\"call-rule-editor\" fxLayout=\"column\">\n  <mat-form-field>\n    <input class=\"code error\" type=\"number\" matInput [(ngModel)]=\"data.code\" placeholder=\"error code\">\n  </mat-form-field>\n  <mat-form-field>\n    <textarea class=\"echo-scrollbar text-area error\" matInput [(ngModel)]=\"data.error\" placeholder=\"error message\" matTextareaAutosize></textarea>\n  </mat-form-field>\n  <codemirror #ruleeditor class=\"auto-height\" [(ngModel)]=\"data.expression\" [config]=\"config\" (change)=\"checkChanges()\" fxFlex></codemirror>\n  <expression-scope-help></expression-scope-help>\n</div>\n"

/***/ }),

/***/ "./src/app/components/call-rule-editor/call-rule-editor.component.scss":
/***/ (function(module, exports) {

module.exports = ".call-rule-editor {\n  min-width: 400px; }\n"

/***/ }),

/***/ "./src/app/components/call-rule-editor/call-rule-editor.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return CallRuleEditorComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};

var CallRuleEditorComponent = /** @class */ (function () {
    function CallRuleEditorComponent() {
        this.data = {};
        this.config = {
            lineNumbers: true,
            mode: 'javascript',
            gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter']
        };
    }
    CallRuleEditorComponent.prototype.ngOnInit = function () {
        var _this = this;
        setTimeout(function () {
            if (!_this.ruleeditor.instance) {
                return;
            }
            _this.ruleeditor.instance.refresh();
            _this.ruleeditor.instance.focus();
        });
    };
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["ViewChild"])('ruleeditor'),
        __metadata("design:type", Object)
    ], CallRuleEditorComponent.prototype, "ruleeditor", void 0);
    CallRuleEditorComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Component"])({
            selector: 'app-call-rule-editor',
            template: __webpack_require__("./src/app/components/call-rule-editor/call-rule-editor.component.html"),
            styles: [__webpack_require__("./src/app/components/call-rule-editor/call-rule-editor.component.scss")]
        }),
        __metadata("design:paramtypes", [])
    ], CallRuleEditorComponent);
    return CallRuleEditorComponent;
}());



/***/ }),

/***/ "./src/app/components/dialog/dialog-host.directive.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return DialogHost; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};

var DialogHost = /** @class */ (function () {
    function DialogHost(viewContainerRef) {
        this.viewContainerRef = viewContainerRef;
    }
    DialogHost = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Directive"])({
            selector: '[dialog-host]'
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_0__angular_core__["ViewContainerRef"]])
    ], DialogHost);
    return DialogHost;
}());



/***/ }),

/***/ "./src/app/components/dialog/dialog.component.html":
/***/ (function(module, exports) {

module.exports = "<div *ngIf=\"u.dialogData.component\" class=\"dialog-backdrop\" (click)=\"doAction($event)\" fxLayout=\"column\" fxLayoutAlign=\"center center\">\n  <div class=\"dialog\" fxLayout=\"column\">\n    <div class=\"dialog-header\">\n      <span>{{(context.options||{}).title||'Dialog'}}</span>\n    </div>\n    <div class=\"dialog-content\" fxFlex>\n      <ng-template dialog-host></ng-template>\n    </div>\n    <div class=\"dialog-commands\" fxLayout=\"row\">\n      <button mat-flat-button *ngIf=\"!!context.ok\" (click)=\"doAction($event, action.ok)\" color=\"accent\" [disabled]=\"!context.valid\" fxFlex>{{context.ok}}</button>\n      <button mat-flat-button (click)=\"doAction($event, action.cancel)\" color=\"none\" fxFlex>{{context.cancel}}</button>\n    </div>  \n  </div>\n</div>"

/***/ }),

/***/ "./src/app/components/dialog/dialog.component.scss":
/***/ (function(module, exports) {

module.exports = ".dialog-backdrop {\n  position: absolute;\n  left: 0;\n  top: 0;\n  width: 100vW;\n  height: 100vh;\n  z-index: 100;\n  background-color: rgba(80, 80, 80, 0.9); }\n"

/***/ }),

/***/ "./src/app/components/dialog/dialog.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export DialogContent */
/* unused harmony export DIALOGACTIONS */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return DialogComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__dialog_host_directive__ = __webpack_require__("./src/app/components/dialog/dialog-host.directive.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__services_util_service__ = __webpack_require__("./src/app/services/util.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var DialogContent = /** @class */ (function () {
    function DialogContent() {
        this.data = {};
    }
    return DialogContent;
}());

var DIALOGACTIONS = {
    ok: 'ok',
    no: 'no',
    cancel: 'cancel'
};
var DialogComponent = /** @class */ (function () {
    function DialogComponent(componentFactoryResolver, u) {
        this.componentFactoryResolver = componentFactoryResolver;
        this.u = u;
        this.action = DIALOGACTIONS;
        this.context = {};
        this.state = {
            loading: false,
            loaded: false
        };
        this.context = this.u.dialogData;
        var dh = this.dialogHost;
    }
    DialogComponent.prototype.loadComponent = function () {
        var _this = this;
        this.state.loading = true;
        setTimeout(function () {
            var componentFactory = _this.componentFactoryResolver.resolveComponentFactory(_this.context.component);
            var viewContainerRef = _this.dialogHost.viewContainerRef;
            viewContainerRef.clear();
            var componentRef = viewContainerRef.createComponent(componentFactory);
            componentRef.instance.data = _this.context.data;
            _this.state.loading = false;
            _this.state.loaded = true;
        });
    };
    DialogComponent.prototype.ngOnInit = function () {
    };
    DialogComponent.prototype.ngDoCheck = function () {
        if (!!this.context.component && !this.state.loading && !this.state.loaded) {
            this.loadComponent();
        }
    };
    DialogComponent.prototype.doAction = function (e, action) {
        console.log('CLICK ON %s', e.target.className);
        if (!e.target.classList.contains('dialog-backdrop')) {
            switch (action) {
                case DIALOGACTIONS.ok:
                    this.context.callback(this.context.data);
                    break;
                case DIALOGACTIONS.cancel:
                case DIALOGACTIONS.no:
                    break;
                default: return;
            }
        }
        this.state.loaded = false;
        this.state.loading = false;
        this.u.closeDialog();
    };
    DialogComponent.prototype.ngOnDestroy = function () {
        this.state.loaded = false;
        this.state.loading = false;
    };
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["ViewChild"])(__WEBPACK_IMPORTED_MODULE_1__dialog_host_directive__["a" /* DialogHost */]),
        __metadata("design:type", __WEBPACK_IMPORTED_MODULE_1__dialog_host_directive__["a" /* DialogHost */])
    ], DialogComponent.prototype, "dialogHost", void 0);
    DialogComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Component"])({
            selector: 'vs-dialog',
            template: __webpack_require__("./src/app/components/dialog/dialog.component.html"),
            styles: [__webpack_require__("./src/app/components/dialog/dialog.component.scss")]
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_0__angular_core__["ComponentFactoryResolver"],
            __WEBPACK_IMPORTED_MODULE_2__services_util_service__["a" /* UtilService */]])
    ], DialogComponent);
    return DialogComponent;
}());



/***/ }),

/***/ "./src/app/components/expression-scope-help/expression-scope-help.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ExpressionScopeHelpComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};

var ExpressionScopeHelpComponent = /** @class */ (function () {
    function ExpressionScopeHelpComponent() {
        this.minimal = false;
    }
    Object.defineProperty(ExpressionScopeHelpComponent.prototype, "min", {
        set: function (v) { this.minimal = v; },
        enumerable: true,
        configurable: true
    });
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Input"])('minimal'),
        __metadata("design:type", Boolean),
        __metadata("design:paramtypes", [Boolean])
    ], ExpressionScopeHelpComponent.prototype, "min", null);
    ExpressionScopeHelpComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Component"])({
            selector: 'expression-scope-help',
            template: "<div class=\"expression-scope-help\" layout-col>\n    <div *ngIf=\"!minimal\" layout-row><span class=\"property\">data</span><span>request body or params</span></div>\n    <div *ngIf=\"!minimal\" layout-row><span class=\"property\">params</span><span>request params</span></div>\n    <div *ngIf=\"!minimal\" layout-row><span class=\"property\">db</span><span>virtual database object</span></div>\n    <div *ngIf=\"!minimal\" layout-row><span class=\"property\">pathValue</span><span>dynamic path values object</span></div>\n    <div *ngIf=\"!minimal\" layout-row><span class=\"property\">headers</span><span>request headers</span></div>\n    <div *ngIf=\"!minimal\" layout-row><span class=\"property\">cookies</span><span>session cookies</span></div>\n    <div layout-row><span class=\"property\">_</span><span>lodash utilities</span></div>\n  </div>"
        })
    ], ExpressionScopeHelpComponent);
    return ExpressionScopeHelpComponent;
}());



/***/ }),

/***/ "./src/app/components/tab/tab-button.directive.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return TabButtonDirective; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};

var TabButtonDirective = /** @class */ (function () {
    function TabButtonDirective(elRef) {
        this.elRef = elRef;
        this.onSelectTab = new __WEBPACK_IMPORTED_MODULE_0__angular_core__["EventEmitter"]();
        this.state = {};
        this.ele = this.elRef.nativeElement;
    }
    Object.defineProperty(TabButtonDirective.prototype, 'tab-button', {
        set: function (nm) {
            this.name = nm;
        },
        enumerable: true,
        configurable: true
    });
    ;
    Object.defineProperty(TabButtonDirective.prototype, "tab", {
        set: function (state) {
            var _this = this;
            this.state = state;
            setTimeout(function () { return _this.state._selectedTab = _this.state._selectedTab || _this.name; });
        },
        enumerable: true,
        configurable: true
    });
    TabButtonDirective.prototype.onClick = function (e) {
        this.state._selectedTab = this.name;
        this.onSelectTab.emit();
    };
    TabButtonDirective.prototype.ngDoCheck = function () {
        this.state[this.name] = (this.state._selectedTab === this.name);
        this.state[this.name] ? this.ele.classList.add('active') : this.ele.classList.remove('active');
    };
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Input"])(),
        __metadata("design:type", String),
        __metadata("design:paramtypes", [String])
    ], TabButtonDirective.prototype, "tab-button", null);
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Input"])(),
        __metadata("design:type", Object),
        __metadata("design:paramtypes", [Object])
    ], TabButtonDirective.prototype, "tab", null);
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Output"])(),
        __metadata("design:type", __WEBPACK_IMPORTED_MODULE_0__angular_core__["EventEmitter"])
    ], TabButtonDirective.prototype, "onSelectTab", void 0);
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["HostListener"])('click', ['$event']),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", void 0)
    ], TabButtonDirective.prototype, "onClick", null);
    TabButtonDirective = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Directive"])({
            selector: '[tab-button]'
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_0__angular_core__["ElementRef"]])
    ], TabButtonDirective);
    return TabButtonDirective;
}());



/***/ }),

/***/ "./src/app/components/tab/tab-content.directive.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return TabContentDirective; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};

var TabContentDirective = /** @class */ (function () {
    function TabContentDirective(elRef) {
        this.elRef = elRef;
        this.state = {};
        this.ele = this.elRef.nativeElement;
    }
    Object.defineProperty(TabContentDirective.prototype, 'tab-content', {
        set: function (nm) {
            this.name = nm;
        },
        enumerable: true,
        configurable: true
    });
    ;
    Object.defineProperty(TabContentDirective.prototype, "tab", {
        set: function (state) {
            this.state = state;
        },
        enumerable: true,
        configurable: true
    });
    ;
    TabContentDirective.prototype.ngDoCheck = function () {
        this.state[this.name] ? this.ele.classList.add('active') : this.ele.classList.remove('active');
    };
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Input"])(),
        __metadata("design:type", String),
        __metadata("design:paramtypes", [String])
    ], TabContentDirective.prototype, "tab-content", null);
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Input"])(),
        __metadata("design:type", Object),
        __metadata("design:paramtypes", [Object])
    ], TabContentDirective.prototype, "tab", null);
    TabContentDirective = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Directive"])({
            selector: '[tab-content]'
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_0__angular_core__["ElementRef"]])
    ], TabContentDirective);
    return TabContentDirective;
}());



/***/ }),

/***/ "./src/app/components/textbox-container/textbox-container.component.html":
/***/ (function(module, exports) {

module.exports = "<div class=\"textbox-container\" fxLayout=\"column\">\n  <label>{{label}}</label>\n  <ng-content></ng-content>\n</div>\n"

/***/ }),

/***/ "./src/app/components/textbox-container/textbox-container.component.scss":
/***/ (function(module, exports) {

module.exports = "label {\n  opacity: .5;\n  font-size: .8em; }\n"

/***/ }),

/***/ "./src/app/components/textbox-container/textbox-container.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return TextboxContainerComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};

var TextboxContainerComponent = /** @class */ (function () {
    function TextboxContainerComponent() {
        this.label = null;
    }
    Object.defineProperty(TextboxContainerComponent.prototype, "hLabel", {
        set: function (l) {
            this.label = l;
        },
        enumerable: true,
        configurable: true
    });
    TextboxContainerComponent.prototype.ngOnInit = function () {
    };
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Input"])('label'),
        __metadata("design:type", String),
        __metadata("design:paramtypes", [String])
    ], TextboxContainerComponent.prototype, "hLabel", null);
    TextboxContainerComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Component"])({
            selector: 'textbox-container',
            template: __webpack_require__("./src/app/components/textbox-container/textbox-container.component.html"),
            styles: [__webpack_require__("./src/app/components/textbox-container/textbox-container.component.scss")]
        }),
        __metadata("design:paramtypes", [])
    ], TextboxContainerComponent);
    return TextboxContainerComponent;
}());



/***/ }),

/***/ "./src/app/components/toolbar-header/toolbar-header.component.html":
/***/ (function(module, exports) {

module.exports = "<div class=\"toolbar-header\" [ngClass]=\"{'collapsed':collapsed}\" fxLayout=\"row\">\n  <img alt=\"\" src=\"../../../assets/cloud-white.svg\">\n  <div class=\"th-divider\"></div>\n  <div class=\"th-info\" fxLayout=\"column\">\n    <div class=\"th-app-name\">Virtual Service</div>\n    <div class=\"th-app-desc\">build a develop web service REST in a few moments</div>\n  </div>\n  <div class=\"th-buttons\" fxLayout=\"row\" fxLayoutAlign=\"start center\" fxFlex>\n    <div class=\"toolbar-title\" fxFlex>{{service.current.getTitle?service.current.getTitle():''}}</div>\n    <button mat-icon-button *ngFor=\"let b of service.current.buttons\" (click)=\"b.click($event)\"\n            [color]=\"b.color ? b.color() : ''\" [disabled]=\"b.disabled&&b.disabled()\">\n      <i aria-label=\"button icon\">{{b.icon}}</i>\n    </button>\n  </div>\n</div>\n"

/***/ }),

/***/ "./src/app/components/toolbar-header/toolbar-header.component.scss":
/***/ (function(module, exports) {

module.exports = ".toolbar-header {\n  height: 160px;\n  top: 0;\n  width: 100vw;\n  background-color: #ddd;\n  z-index: 10;\n  padding: 1.5rem 0;\n  background: #263238;\n  color: #ddd;\n  transition: height .5s ease-in-out;\n  -webkit-transition: height .5s ease-in-out;\n  -moz-transition: height .5s ease-in-out; }\n  .toolbar-header > img {\n    margin: auto 0 auto 50px;\n    width: 90px;\n    height: 90px;\n    min-width: 90px; }\n  .toolbar-header .th-divider {\n    width: 20px;\n    border-right: #ccc 2px solid;\n    opacity: .2; }\n  .toolbar-header .th-info {\n    margin: 20px;\n    font-family: \"Fira Sans\", \"sans-serif\"; }\n  .toolbar-header .th-info .th-app-name {\n      font-size: 2rem;\n      font-weight: 400; }\n  .toolbar-header .th-info .th-app-desc {\n      margin-top: 10px;\n      font-size: 1.2rem;\n      font-weight: 300; }\n  .toolbar-header .th-buttons {\n    margin-right: 24px; }\n  .toolbar-header .th-buttons button i {\n      font-size: 24px; }\n  .toolbar-header .th-buttons .mat-icon-button[disabled][disabled] {\n      color: #666;\n      background-color: transparent !important; }\n  .toolbar-header .toolbar-title {\n    opacity: .8; }\n  .toolbar-header.collapsed {\n    height: 80px;\n    padding: 0; }\n  .toolbar-header.collapsed .th-divider {\n      display: none; }\n  .toolbar-header.collapsed .th-info {\n      margin: 10px 20px; }\n  .toolbar-header.collapsed .th-info .th-app-desc {\n        margin-top: 0;\n        font-size: .8em; }\n  .toolbar-header.collapsed > img {\n      height: 50px;\n      width: 50px;\n      min-width: 50px; }\n"

/***/ }),

/***/ "./src/app/components/toolbar-header/toolbar-header.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ToolbarHeaderComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__services_toolbar_service__ = __webpack_require__("./src/app/services/toolbar.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_router__ = __webpack_require__("./node_modules/@angular/router/esm5/router.js");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var ToolbarHeaderComponent = /** @class */ (function () {
    // @Input() collapsed: boolean;
    function ToolbarHeaderComponent(service, router) {
        var _this = this;
        this.service = service;
        this.router = router;
        this.collapsed = false;
        router.events.forEach(function (e) {
            if (e instanceof __WEBPACK_IMPORTED_MODULE_2__angular_router__["b" /* NavigationStart */]) {
                _this.collapsed = /^\/(editor|monitor)\//gm.test(e.url);
            }
        });
    }
    ToolbarHeaderComponent.prototype.ngOnInit = function () {
    };
    ToolbarHeaderComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Component"])({
            selector: 'toolbar-header',
            template: __webpack_require__("./src/app/components/toolbar-header/toolbar-header.component.html"),
            styles: [__webpack_require__("./src/app/components/toolbar-header/toolbar-header.component.scss")]
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1__services_toolbar_service__["a" /* ToolbarService */],
            __WEBPACK_IMPORTED_MODULE_2__angular_router__["c" /* Router */]])
    ], ToolbarHeaderComponent);
    return ToolbarHeaderComponent;
}());



/***/ }),

/***/ "./src/app/pages/editor/editor.component.html":
/***/ (function(module, exports) {

module.exports = "<div class=\"page-editor\" [ngClass]=\"{'dragging':dragging}\" fxLayout=\"column\" fxFlex>\n  <div class=\"editor-container\" fxLayout=\"row\" fxFlex>\n    <div class=\"editor-list\" fxLayout=\"column\">\n      <div class=\"editor-list-toolbar\" fxLayout=\"row\" fxLayoutAlign=\"start center\">\n        <i>search</i>\n        <input type=\"text\" class=\"flat\" [(ngModel)]=\"searchText\" (input)=\"search()\" placeholder=\"search...\" fxFlex>\n        <div class=\"as-button\" *ngIf=\"!!searchText\" (click)=\"clearSearch()\"><i>close</i></div>\n      </div>\n      <div class=\"editor-list-items\" fxFlex>\n        <div class=\"call-item as-button\" (click)=\"selectCall(call)\" *ngFor=\"let call of calls\" \n             [ngClass]=\"{'active':call.active, 'selected':call===currentCall}\" fxLayout=\"row\">\n          <span class=\"call-verb\">{{call.verb||'GET'}}</span>\n          <!-- <span class=\"call-path fixed\">{{call._url1}}</span> -->\n          <span class=\"call-path fixed\">./</span>\n          <span class=\"call-path\" fxFlex>{{call._url2}}</span>\n        </div>\n      </div>\n    </div>\n    <div class=\"editor-main\" fxLayout=\"column\" fxFlex>\n      <input class=\"hidden\" type=\"file\" #swagger (change)=\"onSwaggerChange($event)\">\n      <div class=\"drop-here\" fxLayout=\"column\" fxLayoutAlign=\"center center\">\n        <div>drop here the file</div>\n      </div>\n      <div class=\"editor-page\" *ngIf=\"manager.current&&!dragging\" fxLayout=\"column\" fxFlex>\n        <!-- VIRTUAL SERVICE -->\n        <div style=\"padding-bottom:10px;\" fxLayout=\"row\">\n          <textbox-container [label]=\"'Virtual Service Name'\" fxFlex=\"70\">\n            <input [(ngModel)]=\"manager.current.name\" (input)=\"checkChanges()\">\n          </textbox-container>\n          <textbox-container [label]=\"'Base Path'\" fxFlex=\"30\">\n            <input class=\"code\" [(ngModel)]=\"manager.current.path\" (input)=\"checkChanges()\">\n          </textbox-container>\n          <textbox-container class=\"centered\" style=\"width:140px;\" [label]=\"'Active'\">\n            <input type=\"checkbox\" [(ngModel)]=\"manager.current.active\" (input)=\"checkChanges()\">\n          </textbox-container>\n        </div>\n        <div class=\"tab-header\" fxLayout=\"row\">\n          <button tab-button=\"call\" [tab]=\"tabState\"><i>label</i>Selected Call</button>\n          <button tab-button=\"database\" [tab]=\"tabState\" (onSelectTab)=\"refresh()\"><i>dns</i>Virtual Database</button>\n          <!-- <button tab-button=\"test\" [tab]=\"tabState\" [disabled]=\"!currentCall\"><i>bug_report</i>Test</button> -->\n          <button tab-button=\"test\" [tab]=\"tabState\" [disabled]=\"true\"><i>bug_report</i>Test</button>\n        </div>\n        <!-- DATABASE -->\n        <div tab-content=\"database\" [tab]=\"tabState\" style=\"overflow:auto;\" fxFlex>\n          <codemirror #editor_db class=\"auto-height\" [(ngModel)]=\"manager.current.dbo\" (change)=\"checkChanges()\" [config]=\"config\" fxFlex></codemirror>\n          <expression-scope-help [minimal]=\"true\"></expression-scope-help>\n        </div>\n        <!-- TEST -->\n        <div tab-content=\"test\" [tab]=\"tabState\" class=\"call-test\" fxFlex>\n          <ng-container *ngIf=\"currentCall\">\n            <div class=\"toolbar\" fxLayout=\"row\">\n              <span *ngIf=\"(currentCall._pathValues||[]).length\" class=\"title\" fxFlex>dynamic values</span>\n            </div>\n            <div class=\"test-dynamic-values\">\n              <div class=\"test-dynamic-value\" *ngFor=\"let v of currentCall._pathValues\" fxLayout=\"row\">\n                <i aria-label=\"dynamic\">label</i>\n                <span class=\"value-name\">{{v.name}}</span>\n                <input code class=\"value\" [(ngModel)]=\"v.value\" placeholder=\"value\" fxFlex>\n              </div>\n            </div>\n            <div class=\"toolbar\" fxLayout=\"row\">\n              <span class=\"title\" fxFlex>body / params</span>\n            </div>\n            <codemirror #editor_test class=\"auto-height\" [(ngModel)]=\"currentCall.testData\" [config]=\"config\"></codemirror>\n            <pre class=\"code test-result\" [ngClass]=\"{'error':test.error}\">{{test.result}}</pre>\n          </ng-container>\n        </div>\n        <!-- CALLS -->\n        <div tab-content=\"call\" [tab]=\"tabState\" style=\"overflow:auto;\" fxFlex>\n          <div *ngIf=\"!currentCall\" class=\"empty-page\" fxLayout=\"column\" fxLayoutAlign=\"center center\">\n            <div *ngIf=\"manager.current.calls.length>0\">select a call</div>\n            <div *ngIf=\"manager.current.calls.length>0\" class=\"or\">or</div>\n            <div class=\"as-button\" (click)=\"createCall()\">create new call</div>\n            <div class=\"or\">or</div>\n            <div class=\"as-button\" (click)=\"openSwagger()\">drop here a swagger json file</div>\n          </div>\n          <div *ngIf=\"confirm\" class=\"confirm\">\n            <div fxLayout=\"column\" fxLayoutAling=\"center center\">\n              <div class=\"title\">{{currentCall.verb}} ./{{currentCall._url2}}</div>\n              <p>Confirm delete this call</p>\n              <button mat-raised-button color=\"warn\" (click)=\"confirmDeleteCall()\">DELETE</button>\n            </div>\n          </div>\n          <ng-container *ngIf=\"currentCall && !confirm\">\n            <div class=\"call-verb-path\" fxLayout=\"row\">\n              <button mat-flat-button class=\"button-verb\" color=\"accent\" [matMenuTriggerFor]=\"menu\">{{currentCall.verb}}</button>\n              <div>{{currentOrigin}}/service/{{manager.current.path}}/</div>\n              <input class=\"code\" [(ngModel)]=\"currentCall.path\" (ngModelChange)=\"refreshUrlPath()\" fxFlex>\n              <button class=\"transparent\" title=\"copy url\" ngxClipboard [cbContent]=\"currentCall._url\"><i>filter_none</i></button>\n              <button class=\"transparent color-warn-light font-20\" title=\"copy url\" (click)=\"deleteCall()\"><i>delete</i></button>\n              <mat-menu #menu=\"matMenu\" >\n                <button mat-menu-item *ngFor=\"let v of verbs\" [ngClass]=\"{'active':v===currentCall.verb}\" (click)=\"setVerb(v)\">{{v}}</button>\n              </mat-menu>\n            </div>\n            <div class=\"toolbar\" fxLayout=\"row\">\n              <span class=\"title\">request rules</span>\n              <span fxFlex></span>\n              <button class=\"flat\" title=\"create new rule\" (click)=\"createRule()\"><i>add_circle_outline</i></button>\n            </div>\n            <div class=\"rule\" *ngFor=\"let rule of currentCall.rules||[]\" fxLayout=\"row\">\n              <span class=\"rule-code\">{{rule.code}}</span>\n              <span class=\"rule-error\" fxFlex>{{rule.error}}</span>\n              <button class=\"flat mini\" title=\"edit rule\" (click)=\"editRule(rule)\"><i>edit</i></button>\n              <button class=\"flat mini\" title=\"delete rule\" (click)=\"deleteRule(rule)\"><i>close</i></button>\n            </div>\n            <div class=\"toolbar\" fxLayout=\"row\">\n              <span class=\"title\">response</span>\n              <span fxFlex></span>\n            </div>\n            <codemirror #editor_resp class=\"auto-height\" [(ngModel)]=\"currentCall.response\" [config]=\"config\" (change)=\"checkChanges()\"></codemirror>\n            <expression-scope-help></expression-scope-help>\n            <!-- <div class=\"call-actions\" fxLayout=\"row\" fxLayoutAlign=\"end center\">\n              <button mat-flat-button color=\"warn\" (click)=\"deleteCall()\">DELETE CALL</button>\n            </div> -->\n          </ng-container>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n"

/***/ }),

/***/ "./src/app/pages/editor/editor.component.scss":
/***/ (function(module, exports) {

module.exports = ".page-editor .editor-container .editor-list {\n  width: 30%;\n  min-width: 300px;\n  background-color: #263238; }\n  .page-editor .editor-container .editor-list .editor-list-toolbar {\n    padding: 10px;\n    position: relative; }\n  .page-editor .editor-container .editor-list .editor-list-toolbar > i {\n      position: absolute;\n      opacity: .4;\n      left: 16px;\n      color: #ccc; }\n  .page-editor .editor-container .editor-list .editor-list-toolbar > .as-button {\n      position: absolute;\n      right: 24px;\n      color: #ccc; }\n  .page-editor .editor-container .editor-list .editor-list-toolbar > .as-button i {\n        line-height: 21px; }\n  .page-editor .editor-container .editor-list .editor-list-toolbar > input {\n      padding-left: 30px;\n      padding-right: 30px;\n      background-color: #222;\n      color: #aaa; }\n  .page-editor .editor-container .editor-list .editor-list-items {\n    padding: 10px 0 10px 10px;\n    overflow: auto;\n    color: #ddd; }\n  .page-editor .editor-container .editor-list .editor-list-items .call-item {\n      padding: 6px 16px 6px;\n      line-height: 13px;\n      font-family: monospace;\n      font-size: .9em; }\n  .page-editor .editor-container .editor-list .editor-list-items .call-item:not(.active) {\n        /* opacity: .6; */ }\n  .page-editor .editor-container .editor-list .editor-list-items .call-item.selected {\n        background-color: #ccc;\n        color: #111; }\n  .page-editor .editor-container .editor-list .editor-list-items .call-item > i {\n        margin-right: 8px; }\n  .page-editor .editor-container .editor-list .editor-list-items .call-item > span {\n        overflow: hidden;\n        text-overflow: ellipsis; }\n  .page-editor .editor-container .editor-list .editor-list-items .call-item .call-verb {\n        width: 70px;\n        text-transform: uppercase;\n        color: #ff4081; }\n  .page-editor .editor-container .editor-list .editor-list-items .call-item .call-path.fixed {\n        opacity: .5; }\n  .page-editor .editor-container .editor-main {\n  background-color: rgba(10, 10, 10, 0.1);\n  position: relative; }\n  .editor-main .drop-here {\n  visibility: hidden;\n  position: absolute;\n  pointer-events: none;\n  width: 100%;\n  height: 100%;\n  top: 0;\n  left: 0;\n  z-index: 30;\n  color: #999; }\n  .editor-main .drop-here > * {\n    padding: 50px;\n    border: #999 4px dashed;\n    font-size: 2em;\n    border-radius: 40px; }\n  .editor-main .empty-page {\n  font-size: 20px;\n  color: #111;\n  width: 100%;\n  height: 100%; }\n  .editor-main .empty-page .or {\n    opacity: .2; }\n  .editor-main .empty-page > * {\n    padding: 4px 8px;\n    border-radius: 10px;\n    color: #999; }\n  .editor-main .empty-page .as-button {\n    background-color: transparent;\n    border: 1px solid transparent;\n    border-radius: 2px; }\n  .editor-main .empty-page .as-button:hover {\n      color: #ff4081;\n      border-color: currentColor;\n      background-color: transparent; }\n  .dragging .editor-main .drop-here {\n  visibility: visible; }\n  .editor-main .editor-page {\n  padding: 10px 20px 20px; }\n  .editor-main .editor-page .editor-toolbar {\n    padding: 0; }\n  .editor-main .editor-page .editor-toolbar .divider {\n      width: 24px;\n      margin-right: 24px;\n      border-right: rgba(10, 10, 10, 0.2) 1px solid;\n      height: 100%; }\n  .tab-header {\n  height: 44px; }\n  .tab-header [tab-button] > i {\n    margin-right: 8px; }\n  .tab-header button .flat > i {\n    font-size: 24px; }\n  .add-new-call {\n  height: 140px; }\n  .add-new-call button {\n    font-size: 2em; }\n  .call {\n  font-family: monospace;\n  padding: 6px;\n  margin-bottom: 2px;\n  border-radius: 4px;\n  color: white;\n  border-bottom: rgba(10, 10, 10, 0.1) 1px solid;\n  cursor: pointer; }\n  .call:hover {\n    background: rgba(10, 10, 10, 0.4); }\n  .call.current {\n    background: #50681d; }\n  .call .call-verb {\n    width: 100px;\n    opacity: .5; }\n  .call .call-path.fixed {\n    opacity: .5; }\n  .call-actions {\n  margin-top: 20px; }\n  .call-verb-path {\n  position: relative;\n  line-height: 28px;\n  font-family: monospace;\n  background-color: white;\n  padding: 4px;\n  color: #aaa;\n  margin-top: 4px; }\n  .call-verb-path .button-verb {\n    height: 28px;\n    line-height: 28px;\n    margin-right: 10px;\n    text-transform: uppercase; }\n  .call-verb-path input {\n    border-color: transparent;\n    outline: none; }\n  .rule {\n  font-family: monospace;\n  color: white;\n  background-color: orangered;\n  line-height: 48px;\n  margin: 2px 0; }\n  .rule .rule-code {\n    margin: 0 10px;\n    font-weight: bold; }\n  .rule .rule-error {\n    margin: 0 10px; }\n  .confirm {\n  position: relative;\n  width: 100%;\n  height: 100%; }\n  .confirm > div {\n    position: absolute;\n    margin: auto;\n    left: 0;\n    top: 0;\n    right: 0;\n    bottom: 0;\n    width: 240px;\n    height: 240px;\n    text-align: center; }\n  .confirm > div .title {\n      font-weight: bold; }\n"

/***/ }),

/***/ "./src/app/pages/editor/editor.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return EditorComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__services_auth_service__ = __webpack_require__("./src/app/services/auth.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__services_util_service__ = __webpack_require__("./src/app/services/util.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__angular_router__ = __webpack_require__("./node_modules/@angular/router/esm5/router.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__angular_common_http__ = __webpack_require__("./node_modules/@angular/common/esm5/http.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__components_call_rule_editor_call_rule_editor_component__ = __webpack_require__("./src/app/components/call-rule-editor/call-rule-editor.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__services_document_service__ = __webpack_require__("./src/app/services/document.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__services_toolbar_service__ = __webpack_require__("./src/app/services/toolbar.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8_codemirror_mode_javascript_javascript__ = __webpack_require__("./node_modules/codemirror/mode/javascript/javascript.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8_codemirror_mode_javascript_javascript___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_8_codemirror_mode_javascript_javascript__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9_lodash__ = __webpack_require__("./node_modules/lodash/lodash.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9_lodash___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_9_lodash__);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};










var EditorComponent = /** @class */ (function () {
    function EditorComponent(auth, router, toolbar, manager, u, http) {
        this.auth = auth;
        this.router = router;
        this.toolbar = toolbar;
        this.manager = manager;
        this.u = u;
        this.http = http;
        this.config = {
            lineNumbers: true,
            mode: 'javascript',
            gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter']
        };
        this.verbs = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'connect', 'trace'];
        this.searchText = '';
        this.calls = [];
        this.currentCall = null;
        this.loading = false;
        this.dragging = false;
        this.tabState = {};
        this.test = {};
        this.confirm = null;
        this.currentOrigin = '';
        this.currentOrigin = location.origin;
    }
    EditorComponent.prototype.refreshPathValues = function () {
        var _this = this;
        if (!this.currentCall) {
            return;
        }
        this.currentCall._pathValues = [];
        ((this.currentCall || {}).path || '').split('/').forEach(function (part) {
            var m = (/\{(.*?)\}/g).exec(part);
            if (m) {
                _this.currentCall._pathValues.push({ name: m[1], value: null });
            }
        });
    };
    EditorComponent.prototype.refreshUrlPath = function () {
        this.refreshPathValues();
        this.checkChanges();
    };
    EditorComponent.prototype.onDrop = function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        this.dragging = false;
        this.manager.loadSwagger(evt);
    };
    EditorComponent.prototype.onDragOver = function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        this.dragging = true;
    };
    EditorComponent.prototype.onDragLeave = function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        this.dragging = false;
    };
    EditorComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.search();
        this.toolbar.register({
            buttons: [{
                    icon: 'add_circle_outline',
                    tooltip: 'new call',
                    click: function (e) { return _this.createCall(); }
                }, {
                    icon: 'save',
                    disabled: function () { return !(_this.manager.current || {})._modified; },
                    tooltip: 'save service',
                    color: function () { return 'accent'; },
                    click: function (e) { return _this.manager.save(); }
                }, {
                    divider: true
                }, {
                    icon: 'desktop_windows',
                    tooltip: 'monitor',
                    click: function (e) { return _this.router.navigate(['monitor/' + (_this.manager.current || {})._id]); }
                }, {
                    icon: 'view_module',
                    tooltip: 'services list',
                    click: function (e) { return _this.router.navigate(['list']); }
                }, {
                    icon: 'power_settings_new',
                    tooltip: 'logout',
                    click: function (e) { return _this.manager.logout(); }
                }]
        });
    };
    EditorComponent.prototype.clearConfirm = function () {
        if (this.confirm) {
            clearTimeout(this.confirm);
        }
        this.confirm = null;
    };
    EditorComponent.prototype.ngOnDestroy = function () {
        this.toolbar.unregister();
        this.clearConfirm();
    };
    EditorComponent.prototype.logout = function () {
        this.auth.logout();
        this.router.navigate(['login']);
    };
    EditorComponent.prototype.search = function () {
        var _this = this;
        this.calls = __WEBPACK_IMPORTED_MODULE_9_lodash__["filter"](((this.manager || {})['current'] || {}).calls || [], function (c) {
            return _this.searchText ? c._url2.indexOf(_this.searchText) > -1 : true;
        });
    };
    EditorComponent.prototype.clearSearch = function () {
        this.searchText = '';
        this.search();
    };
    EditorComponent.prototype.changePassword = function () {
        // TODO...
    };
    EditorComponent.prototype.openSwagger = function () {
        this.swaggerInput.nativeElement.click();
    };
    EditorComponent.prototype.clearFile = function () {
        this.swaggerInput.nativeElement.value = '';
        this.loading = false;
    };
    EditorComponent.prototype.onSwaggerChange = function (e) {
        e.preventDefault();
        e.stopPropagation();
        this.manager.loadSwagger(e);
    };
    EditorComponent.prototype.checkChanges = function () {
        this.manager.checkDocChanges();
    };
    EditorComponent.prototype.selectCall = function (call) {
        this.clearConfirm();
        this.currentCall = call;
    };
    EditorComponent.prototype.refresh = function () {
        var _this = this;
        setTimeout(function () {
            if (!_this.dbeditor.instance) {
                return;
            }
            _this.dbeditor.instance.refresh();
            _this.dbeditor.instance.focus();
        });
    };
    EditorComponent.prototype.respIcon = function (type) {
        switch (type) {
            case 'file':
                return 'insert_drive_file';
            default:
                return 'code';
        }
    };
    EditorComponent.prototype.createCall = function () {
        if (!this.manager.current) {
            return;
        }
        this.clearConfirm();
        var call = this.manager.createCall();
        this.search();
        this.selectCall(call);
        this.checkChanges();
    };
    EditorComponent.prototype.createRule = function () {
        var _this = this;
        var rule = {
            code: 500,
            error: '',
            expression: ''
        };
        this.editRule(rule, function () {
            _this.currentCall.rules.push(rule);
            _this.checkChanges();
        });
    };
    EditorComponent.prototype.editRule = function (rule, cb) {
        var _this = this;
        this.u.dialog(__WEBPACK_IMPORTED_MODULE_5__components_call_rule_editor_call_rule_editor_component__["a" /* CallRuleEditorComponent */], rule, { title: 'Rule Editor' })
            .then(function (mrule) {
            __WEBPACK_IMPORTED_MODULE_9_lodash__["extend"](rule, mrule);
            return cb ? cb() : _this.checkChanges();
        });
    };
    EditorComponent.prototype.deleteRule = function (rule) {
        __WEBPACK_IMPORTED_MODULE_9_lodash__["pull"](this.currentCall.rules, rule);
        this.checkChanges();
    };
    EditorComponent.prototype.confirmDeleteCall = function () {
        this.clearConfirm();
        __WEBPACK_IMPORTED_MODULE_9_lodash__["pull"](this.manager.current.calls, this.currentCall);
        this.currentCall = null;
        this.checkChanges();
    };
    EditorComponent.prototype.deleteCall = function () {
        var _this = this;
        this.confirm = setTimeout(function () { return _this.confirm = null; }, 5000);
    };
    EditorComponent.prototype.setVerb = function (verb) {
        this.currentCall.verb = verb;
        this.checkChanges();
    };
    EditorComponent.prototype.testCall = function () {
        /*const vo = {};
        if (this.currentCall._pathValues) this.currentCall._pathValues.forEach((v:any) => vo[v.name] = v.value);
        const path = this.u.format(this.currentCall.path, vo);
        const body = this.u.parseJS(this.currentCall.testData);
        const data = _.isString(body) ? JSON.parse(body) : body;
        const params = (data && ['get', 'delete'].indexOf(this.currentCall.verb) > -1) ? this.u.getUrlParams(data) : null;
        const body_arg = (data && ['post', 'put'].indexOf(this.currentCall.verb) > -1) ? data : null;
        const url = this.u.checkUrl('api/player', this.current.path, path + (params || ''));
        this.doHttp(url, this.currentCall.verb, body_arg || {})
          .subscribe(res => {
            this.test.error = false;
            this.test.result = JSON.stringify(res, null, 2);
          }, err => {
            this.test.error = !!err;
            this.test.result = UtilService.getErrorMessage(err);
          });*/
    };
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["ViewChild"])('swagger'),
        __metadata("design:type", __WEBPACK_IMPORTED_MODULE_0__angular_core__["ElementRef"])
    ], EditorComponent.prototype, "swaggerInput", void 0);
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["ViewChild"])('editor_db'),
        __metadata("design:type", Object)
    ], EditorComponent.prototype, "dbeditor", void 0);
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["HostListener"])('drop', ['$event']),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", void 0)
    ], EditorComponent.prototype, "onDrop", null);
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["HostListener"])('dragenter', ['$event']),
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["HostListener"])('dragover', ['$event']),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", void 0)
    ], EditorComponent.prototype, "onDragOver", null);
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["HostListener"])('dragleave', ['$event']),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", void 0)
    ], EditorComponent.prototype, "onDragLeave", null);
    EditorComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Component"])({
            selector: 'app-editor',
            template: __webpack_require__("./src/app/pages/editor/editor.component.html"),
            styles: [__webpack_require__("./src/app/pages/editor/editor.component.scss")],
            host: { 'class': 'flex-host' }
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1__services_auth_service__["a" /* AuthService */],
            __WEBPACK_IMPORTED_MODULE_3__angular_router__["c" /* Router */],
            __WEBPACK_IMPORTED_MODULE_7__services_toolbar_service__["a" /* ToolbarService */],
            __WEBPACK_IMPORTED_MODULE_6__services_document_service__["a" /* DocumentService */],
            __WEBPACK_IMPORTED_MODULE_2__services_util_service__["a" /* UtilService */],
            __WEBPACK_IMPORTED_MODULE_4__angular_common_http__["b" /* HttpClient */]])
    ], EditorComponent);
    return EditorComponent;
}());



/***/ }),

/***/ "./src/app/pages/list/list.component.html":
/***/ (function(module, exports) {

module.exports = "<div class=\"document-list\" fxLayout=\"row\" fxFlex>\n  <div class=\"list-commands\" fxLayout=\"column\" [ngClass]=\"{'empty':!manager.services.length}\">\n    <svg class=\"page-background\" width=\"100%\" height=\"100%\" viewBox=\"0 0 400 800\" preserveAspectRatio=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n      <path stroke=\"null\" d=\"M 0 0 L 400 0 L 300 800 L 0 800\" stroke-opacity=\"null\" stroke-linecap=\"null\" stroke-linejoin=\"null\" stroke-width=\"NaN\" fill=\"#263238\"/>\n    </svg>\n    <button mat-stroked-button color=\"accent\" (click)=\"newVirtualService($event)\">new virtual service</button>\n    <button mat-stroked-button color=\"accent\" (click)=\"importSwagger($event)\">generate by swagger</button>\n  </div>\n  <div class=\"list-container\" fxFlex>\n    <ng-container *ngFor=\"let srv of manager.services\">\n      <mat-card class=\"document-card md-ripple\" [ngClass]=\"{'active':srv.active, 'current':srv._id===(manager.current||{})._id}\">\n        <div class=\"confirm\" *ngIf=\"srv._confirm\" fxLayout=\"column\" fxLayoutAling=\"center center\">\n          <div class=\"title\">{{srv.name}}</div>\n          <p>Confirm delete this service</p>\n          <button mat-raised-button color=\"warn\" (click)=\"confirmDelete(srv)\">DELETE</button>\n        </div>\n        <mat-card-header *ngIf=\"!srv._confirm\" (click)=\"open(srv)\">\n          <div mat-card-avatar><i [ngClass]=\"{'color-accent':srv._modified}\">{{srv.active?'radio_button_checked':'radio_button_unchecked'}}</i></div>\n          <mat-card-title>{{srv.name}}</mat-card-title>\n          <mat-card-subtitle>{{srv.path}}</mat-card-subtitle>\n        </mat-card-header>\n        <mat-card-content *ngIf=\"!srv._confirm\" (click)=\"open(srv)\">\n          <p class=\"document-info\">\n            {{srv.description}}.\n            Service has {{srv.calls.length}} calls.\n          </p>\n          <p class=\"document-data\">created by {{srv.author}} at <span>{{srv.createdAt}}</span></p>\n        </mat-card-content>\n        <mat-card-actions *ngIf=\"!srv._confirm\">\n          <button *ngIf=\"srv.active\" mat-icon-button (click)=\"monitor(srv)\">\n            <i aria-label=\"monitor\">desktop_windows</i>\n          </button>\n          <button mat-icon-button (click)=\"download(srv)\">\n            <i aria-label=\"dowload\">get_app</i>\n          </button>\n          <button mat-icon-button color=\"warn\" (click)=\"delete(srv)\">\n            <i aria-label=\"delete\">delete</i>\n          </button>\n          <div fxFlex></div>\n          <button mat-button color=\"accent\" (click)=\"open(srv)\">OPEN</button>\n        </mat-card-actions>\n      </mat-card>\n    </ng-container>\n  </div>\n</div>\n"

/***/ }),

/***/ "./src/app/pages/list/list.component.scss":
/***/ (function(module, exports) {

module.exports = ".document-list .list-commands {\n  width: 300px;\n  background: rgba(200, 200, 200, 0.1);\n  color: #ccc;\n  padding: 30px 80px 30px 40px;\n  position: relative; }\n  .document-list .list-commands > button {\n    margin: 20px 0; }\n  .document-list .list-commands.empty > button {\n    -webkit-transform: translate(40vw, 10vh) scale(1.2);\n            transform: translate(40vw, 10vh) scale(1.2); }\n  .document-list .list-container {\n  padding: 20px;\n  overflow: auto; }\n  .document-list .list-container .document-card {\n    margin: 10px;\n    width: 280px;\n    max-height: 200px;\n    max-width: 300px;\n    min-height: 200px;\n    min-width: 248px;\n    display: inline-block;\n    background-color: ghostwhite;\n    padding: 24px 24px 0;\n    -webkit-box-shadow: none;\n            box-shadow: none;\n    overflow: hidden; }\n  .document-list .list-container .document-card .confirm {\n      height: 160px;\n      padding: 30px;\n      text-align: center; }\n  .document-list .list-container .document-card .confirm .title {\n        font-weight: bold; }\n  .document-list .list-container .document-card .mat-card-header {\n      min-height: 40px;\n      max-height: 40px; }\n  .document-list .list-container .document-card .mat-card-content {\n      min-height: 90px;\n      max-height: 90px; }\n  .document-list .list-container .document-card .mat-card-header,\n    .document-list .list-container .document-card .mat-card-content {\n      cursor: pointer; }\n  .document-list .list-container .document-card:hover {\n      background-color: white;\n      -webkit-box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12);\n              box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12); }\n  .document-list .list-container .document-card:not(.active) {\n      background: repeating-linear-gradient(45deg, ghostwhite, ghostwhite 10px, rgba(200, 200, 200, 0.1) 10px, rgba(200, 200, 200, 0.1) 20px); }\n  .document-list .list-container .document-card:not(.active):hover {\n        background: repeating-linear-gradient(45deg, ghostwhite, ghostwhite 10px, rgba(250, 250, 250, 0.3) 10px, rgba(250, 250, 250, 0.3) 20px); }\n  .document-list .list-container .document-card.current {\n      outline: #ff4081 4px solid; }\n  .document-list .list-container .document-card [mat-card-avatar] > i {\n      font-size: 36px; }\n  .document-list .list-container .document-card button i {\n      font-size: 1.5em; }\n  .document-list .list-container .document-card .document-info {\n      white-space: pre-line; }\n  .document-list .list-container .document-card .document-data {\n      opacity: .5;\n      font-size: .7em; }\n  .document-list .list-container .document-card .document-data > span {\n        color: fuchsia; }\n  .document-list .list-container .document-card .mat-card-title {\n      font-weight: bold; }\n  .document-list .list-container .document-card .mat-card-actions {\n      border-top: rgba(10, 10, 10, 0.1) 1px solid; }\n"

/***/ }),

/***/ "./src/app/pages/list/list.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ListComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_router__ = __webpack_require__("./node_modules/@angular/router/esm5/router.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__services_auth_service__ = __webpack_require__("./src/app/services/auth.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__services_util_service__ = __webpack_require__("./src/app/services/util.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__services_toolbar_service__ = __webpack_require__("./src/app/services/toolbar.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__services_document_service__ = __webpack_require__("./src/app/services/document.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};






var ListComponent = /** @class */ (function () {
    function ListComponent(auth, u, router, toolbar, manager) {
        this.auth = auth;
        this.u = u;
        this.router = router;
        this.toolbar = toolbar;
        this.manager = manager;
        this.documents = [];
        this.manager.refreshList();
    }
    ListComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.toolbar.register({
            buttons: [{
                    icon: 'power_settings_new',
                    tooltip: 'logout',
                    click: function (e) { return _this.manager.logout(); }
                }]
        });
    };
    ListComponent.prototype.ngOnDestroy = function () {
        this.toolbar.unregister();
    };
    ListComponent.prototype.open = function (srv) {
        this.manager.setCurrent(srv, 'editor/' + srv._id);
    };
    ListComponent.prototype.monitor = function (srv) {
        this.manager.setCurrent(srv, 'monitor/' + srv._id);
    };
    ListComponent.prototype.download = function (srv) {
        // TODO...
        console.log('Download service', srv);
    };
    ListComponent.prototype.confirmDelete = function (srv) {
        clearTimeout(srv._confirm);
        this.manager.deleteService(srv);
    };
    ListComponent.prototype.delete = function (srv) {
        srv._confirm = setTimeout(function () { return srv._confirm = null; }, 5000);
    };
    ListComponent.prototype.newVirtualService = function () {
        var _this = this;
        this.manager.createService().then(function () { return _this.router.navigate(['editor/' + _this.manager.current._id]); });
    };
    ListComponent.prototype.importSwagger = function () {
        // TODO...
        console.log('Import swagger');
    };
    ListComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Component"])({
            selector: 'app-list',
            template: __webpack_require__("./src/app/pages/list/list.component.html"),
            styles: [__webpack_require__("./src/app/pages/list/list.component.scss")],
            host: { 'class': 'flex-host' }
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_2__services_auth_service__["a" /* AuthService */],
            __WEBPACK_IMPORTED_MODULE_3__services_util_service__["a" /* UtilService */],
            __WEBPACK_IMPORTED_MODULE_1__angular_router__["c" /* Router */],
            __WEBPACK_IMPORTED_MODULE_4__services_toolbar_service__["a" /* ToolbarService */],
            __WEBPACK_IMPORTED_MODULE_5__services_document_service__["a" /* DocumentService */]])
    ], ListComponent);
    return ListComponent;
}());



/***/ }),

/***/ "./src/app/pages/login/login.component.html":
/***/ (function(module, exports) {

module.exports = "<div class=\"page-login\" fxLayout=\"row\" fxFlex>\n  <svg class=\"page-background\" width=\"100%\" height=\"100%\" viewBox=\"0 0 800 800\" preserveAspectRatio=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <path stroke=\"null\" d=\"M 0 0 L 800 0 L 800 100 L 0 700\" stroke-opacity=\"null\" stroke-linecap=\"null\" stroke-linejoin=\"null\" stroke-width=\"NaN\" fill=\"#263238\"/>\n  </svg>\n  <div fxFlex></div>\n  <div class=\"label-desc grow label-desc-first\">In the development of web applications it is often useful to define the REST call contract in the first phase.</div>\n  <div class=\"label-desc grow label-desc-second\">VirtualService allows you to write the set of calls that define a web rest service in a few moments.</div>\n  <div class=\"label-desc grow label-desc-third\">In case you have descriptor files like <a href=\"https://swagger.io\" target=\"_blank\">swagger.io</a> the server generation is immediate.</div>\n  <div class=\"login-box\" fxLayout=\"column\">\n    <div fxFlex></div>\n    <mat-form-field>\n      <input type=\"email\" matInput placeholder=\"email\" (keyup.enter)=\"login($event)\" [(ngModel)]=\"credentials.email\">\n    </mat-form-field>\n    <mat-form-field>\n      <input type=\"password\" matInput placeholder=\"password\" (keyup.enter)=\"login($event)\" [(ngModel)]=\"credentials.password\">\n    </mat-form-field>\n    <div class=\"login-box-buttons\" fxLayout=\"row\" fxLayoutAlign=\"end center\">\n      <button mat-stroked-button color=\"accent\" (click)=\"login($event)\">submit</button>\n    </div>\n  </div>\n</div>\n"

/***/ }),

/***/ "./src/app/pages/login/login.component.scss":
/***/ (function(module, exports) {

module.exports = ".page-login {\n  position: relative;\n  overflow: hidden; }\n  .page-login .login-box {\n    padding: 40px;\n    width: 400px; }\n  .page-login .login-box .mat-form-field {\n      height: 66px;\n      background-color: #ddd;\n      padding: 10px 10px 0 10px; }\n  .page-login .label-desc {\n    position: absolute;\n    color: #ccc;\n    opacity: .3;\n    width: 25%;\n    max-width: 300px;\n    background: rgba(200, 200, 200, 0.1);\n    border-radius: 20px;\n    padding: 10px;\n    font-size: .7em;\n    text-align: center; }\n  .page-login .label-desc.label-desc-first {\n      top: 5%;\n      left: 40%; }\n  .page-login .label-desc.label-desc-second {\n      top: 40%;\n      left: 10%; }\n  .page-login .label-desc.label-desc-third {\n      top: 80%;\n      left: 30%;\n      background: rgba(10, 10, 10, 0.2);\n      color: #000; }\n  .page-login .label-desc:hover {\n      background-color: #fc00ba;\n      opacity: 1;\n      color: white; }\n"

/***/ }),

/***/ "./src/app/pages/login/login.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return LoginComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__services_util_service__ = __webpack_require__("./src/app/services/util.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_router__ = __webpack_require__("./node_modules/@angular/router/esm5/router.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__services_auth_service__ = __webpack_require__("./src/app/services/auth.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__app_component__ = __webpack_require__("./src/app/app.component.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};





var CODEMESSAGE = {
    none: '',
    new: 'A message has been sent to the email address you entered,\nfollow the instructions to access the application.',
    idle: 'A message has already been sent to the entered email address.\n' +
        'The link in the email is still valid, follow the path to access the application.'
};
var LoginComponent = /** @class */ (function () {
    function LoginComponent(u, router, appp, auth) {
        this.u = u;
        this.router = router;
        this.appp = appp;
        this.auth = auth;
        this.constants = {
            // esempio: almeno una cifra, un carattere minuscolo ed uno maiuscolo,
            // per una lunghezza minima di 8 caratteri
            // (ammessi cifre, caratteri a-z maiuscoli e minuscoli, "_", "-")
            // pswdRgx: '^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z_\\-]{8,}$',
            // pswdRgx: '^[0-9a-zA-Z_\\-]{8,}$',
            pswdRgx: '^[0-9a-zA-Z_\\-]{2,}$',
            userRgx: '^[0-9a-zA-Z_\\-\\.@]{2,}$',
            emailRgx: '^[a-zA-Z0-9.!#$%&\'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'
        };
        this.credentials = {
            email: '',
            password: ''
        };
        this.valid = false;
        this.error = {
            title: '',
            message: ''
        };
        this.signing = false;
    }
    LoginComponent.prototype.setError = function (err, title) {
        if (title === void 0) { title = null; }
        this.error.message = __WEBPACK_IMPORTED_MODULE_1__services_util_service__["a" /* UtilService */].getErrorMessage(err);
        this.error.title = title;
    };
    LoginComponent.prototype.handleErr = function (err) {
        this.setError(err);
        this.u.idle.stop();
    };
    LoginComponent.prototype.ngOnInit = function () {
        this.u.idle.stop();
    };
    LoginComponent.prototype.validate = function () {
        var e_rgx = new RegExp(this.constants.emailRgx, 'gi');
        return e_rgx.test(this.credentials.email);
    };
    LoginComponent.prototype.login = function (e) {
        var _this = this;
        if (!this.validate()) {
            return this.setError('Incorrect email!');
        }
        this.u.idle.start('checking credentials...');
        this.auth.login(this.credentials).then(function (resp) {
            _this.u.idle.stop();
            switch (resp.code) {
                case __WEBPACK_IMPORTED_MODULE_3__services_auth_service__["c" /* LOGINRESPCODE */].ok:
                    _this.router.navigate(['list']);
                    break;
                case __WEBPACK_IMPORTED_MODULE_3__services_auth_service__["c" /* LOGINRESPCODE */].none:
                    _this.u.notify(CODEMESSAGE[resp.code]).then(function () {
                        return _this.auth.createUser(_this.credentials).then(function () {
                            return _this.u.notify(CODEMESSAGE[__WEBPACK_IMPORTED_MODULE_3__services_auth_service__["c" /* LOGINRESPCODE */].new]);
                        }, function (err) { return _this.handleErr(err); });
                    });
                    break;
                default:
                    _this.u.notify(CODEMESSAGE[resp.code]);
            }
        }, function (err) { return _this.handleErr(err); });
    };
    LoginComponent.prototype.toggle = function () {
        this.appp.toolbar = !this.appp.toolbar;
    };
    LoginComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Component"])({
            selector: 'app-login',
            template: __webpack_require__("./src/app/pages/login/login.component.html"),
            styles: [__webpack_require__("./src/app/pages/login/login.component.scss")],
            host: { 'class': 'flex-host' }
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1__services_util_service__["a" /* UtilService */],
            __WEBPACK_IMPORTED_MODULE_2__angular_router__["c" /* Router */],
            __WEBPACK_IMPORTED_MODULE_4__app_component__["a" /* AppComponent */],
            __WEBPACK_IMPORTED_MODULE_3__services_auth_service__["a" /* AuthService */]])
    ], LoginComponent);
    return LoginComponent;
}());



/***/ }),

/***/ "./src/app/pages/monitor/monitor.component.html":
/***/ (function(module, exports) {

module.exports = "<div class=\"page-monitor\" fxLayout=\"column\" fxFlex>\n  <h3>{{(manager.current||{}).name}} <span>calls monitor</span></h3>\n  <div class=\"monitor-items\" fxLayout=\"column\" fxFlex>\n    <div class=\"log-item\" *ngFor=\"let item of logItems\" (click)=\"setDetail(item)\"\n        [ngClass]=\"{'error':!!item.error, 'current':item===detail}\"\n        fxLayout=\"row\" fxLayoutAlign=\"start center\">\n      <span class=\"time\">{{item._time_str}}</span>\n      <span class=\"author\">{{item.author}}</span>\n      <span class=\"method\">{{item.content.verb}}</span>\n      <span class=\"path\" fxFlex>.{{item.content.base}}{{item.content.path}}</span>\n    </div>\n  </div>\n  <div class=\"monitor-detail\" *ngIf=\"!!detail\">\n    <button class=\"transparent\" title=\"close detail\" (click)=\"closeDetail()\"><i>close</i></button>\n    <pre>{{detail_str}}</pre>\n  </div>\n</div>\n"

/***/ }),

/***/ "./src/app/pages/monitor/monitor.component.scss":
/***/ (function(module, exports) {

module.exports = ".page-monitor > h3 {\n  padding: 0 20px;\n  text-transform: uppercase;\n  margin-bottom: 0; }\n  .page-monitor > h3 span {\n    opacity: .4; }\n  .page-monitor .monitor-items {\n  overflow: auto;\n  padding: 20px; }\n  .page-monitor .monitor-items .log-item {\n    font-family: monospace;\n    font-size: .9em;\n    min-height: 18px;\n    cursor: pointer; }\n  .page-monitor .monitor-items .log-item .time {\n      width: 120;\n      margin-right: 10px;\n      opacity: .7; }\n  .page-monitor .monitor-items .log-item .author {\n      width: 240;\n      margin-right: 10px; }\n  .page-monitor .monitor-items .log-item .method {\n      width: 100;\n      margin-right: 10px; }\n  .page-monitor .monitor-items .log-item .path {\n      color: #111; }\n  .page-monitor .monitor-items .log-item.current {\n      background-color: #fc00ba;\n      color: white; }\n  .page-monitor .monitor-items .log-item:hover {\n      background-color: #fc00b926; }\n  .page-monitor .monitor-items .log-item.error {\n      background-color: rgba(200, 0, 0, 0.1); }\n  .page-monitor .monitor-items .log-item.error:hover {\n        background-color: #d60000; }\n  .page-monitor .monitor-detail {\n  overflow: auto;\n  padding: 20px;\n  max-height: 50%;\n  color: #ddd;\n  background-color: #263238;\n  position: relative; }\n  .page-monitor .monitor-detail pre {\n    white-space: pre-wrap; }\n  .page-monitor .monitor-detail button {\n    position: fixed;\n    right: 20px;\n    top: 50%;\n    color: #ccc;\n    font-size: 2em;\n    margin-top: 20px; }\n"

/***/ }),

/***/ "./src/app/pages/monitor/monitor.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return MonitorComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__services_toolbar_service__ = __webpack_require__("./src/app/services/toolbar.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__services_document_service__ = __webpack_require__("./src/app/services/document.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__angular_router__ = __webpack_require__("./node_modules/@angular/router/esm5/router.js");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};




var MonitorComponent = /** @class */ (function () {
    function MonitorComponent(toolbar, router, manager) {
        this.toolbar = toolbar;
        this.router = router;
        this.manager = manager;
        this.logItems = [];
        this.detail = null;
        this.detail_str = null;
    }
    MonitorComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.toolbar.register({
            buttons: [{
                    divider: true
                }, {
                    icon: 'create',
                    tooltip: 'edt service',
                    click: function (e) { return _this.router.navigate(['editor/' + (_this.manager.current || {})._id]); }
                }, {
                    icon: 'view_module',
                    tooltip: 'services list',
                    click: function (e) { return _this.router.navigate(['list']); }
                }, {
                    icon: 'power_settings_new',
                    tooltip: 'logout',
                    click: function (e) { return _this.manager.logout(); }
                }]
        });
        this.interval = setInterval(function () { return _this.refresh(); }, 2000);
    };
    MonitorComponent.prototype.ngOnDestroy = function () {
        this.toolbar.unregister();
        clearInterval(this.interval);
    };
    MonitorComponent.prototype.refresh = function () {
        var _this = this;
        var last = this.logItems.length > 0 ? this.logItems[0].time : 0;
        this.manager.getLog(last).then(function (items) {
            items.sort(function (i1, i2) { return i2.time - i1.time; }).forEach(function (i) {
                i._time = new Date(i.time);
                i._time_str = i._time.toLocaleTimeString();
            });
            _this.logItems = items.concat(_this.logItems);
        });
    };
    MonitorComponent.prototype.setDetail = function (item) {
        this.detail = item;
        this.detail_str = item ? JSON.stringify(item, null, 2) : null;
    };
    MonitorComponent.prototype.closeDetail = function () {
        this.setDetail();
    };
    MonitorComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Component"])({
            selector: 'app-monitor',
            template: __webpack_require__("./src/app/pages/monitor/monitor.component.html"),
            styles: [__webpack_require__("./src/app/pages/monitor/monitor.component.scss")],
            host: { 'class': 'flex-host' }
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1__services_toolbar_service__["a" /* ToolbarService */],
            __WEBPACK_IMPORTED_MODULE_3__angular_router__["c" /* Router */],
            __WEBPACK_IMPORTED_MODULE_2__services_document_service__["a" /* DocumentService */]])
    ], MonitorComponent);
    return MonitorComponent;
}());



/***/ }),

/***/ "./src/app/services/auth.service.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return LOGINRESPCODE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AuthService; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return CanActivateAuth; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_common_http__ = __webpack_require__("./node_modules/@angular/common/esm5/http.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__environments_environment__ = __webpack_require__("./src/environments/environment.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__util_service__ = __webpack_require__("./src/app/services/util.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_lodash__ = __webpack_require__("./node_modules/lodash/lodash.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_lodash___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_lodash__);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};





var CONSTANTS = {
    secret: 'VIRTUAL-SERVICE-EDITOR'
};
var LOGINRESPCODE;
(function (LOGINRESPCODE) {
    LOGINRESPCODE["ok"] = "ok";
    LOGINRESPCODE["new"] = "new";
    LOGINRESPCODE["none"] = "none";
    LOGINRESPCODE["idle"] = "idle"; // utente sospeso (mail inviata in attesa di accettazione)
})(LOGINRESPCODE || (LOGINRESPCODE = {}));
var AuthService = /** @class */ (function () {
    function AuthService(http, u) {
        this.http = http;
        this.u = u;
        this.authenticated = false;
        this.user = null;
    }
    AuthService.prototype.checkUser = function () {
        var _this = this;
        return new Promise(function (res, rej) {
            var url = _this.getUrl('user/me');
            _this.http.get(url).subscribe(function (user) {
                _this.user = user;
                res();
            }, function (err) {
                _this.logout();
                rej(err);
            });
        });
    };
    AuthService.prototype.getToken = function () {
        return this.u.storage.get('token');
    };
    AuthService.prototype.getAuthorizationHeader = function () {
        return this.authenticated ? "Bearer " + this.getToken() : "Basic " + btoa(CONSTANTS.secret);
    };
    AuthService.prototype.getUrl = function (path) {
        return (__WEBPACK_IMPORTED_MODULE_2__environments_environment__["a" /* environment */].origin || '') + path;
    };
    AuthService.prototype.createUser = function (credentials) {
        var data = __WEBPACK_IMPORTED_MODULE_4_lodash__["pick"](credentials, ['email', 'password']);
        return this.http.post(this.getUrl('user'), data).toPromise();
    };
    AuthService.prototype.login = function (credentials) {
        var _this = this;
        return new Promise(function (res, rej) {
            var data = __WEBPACK_IMPORTED_MODULE_4_lodash__["pick"](credentials, ['email', 'password']);
            _this.http
                .post(_this.getUrl('auth/local'), data)
                .subscribe(function (resp) {
                _this.authenticated = !!resp.token;
                _this.u.storage.set('token', resp.token);
                switch (resp.code) {
                    case LOGINRESPCODE.ok: return _this.checkUser().then(function () { return res(resp); }, rej);
                    default: res(resp);
                }
            }, rej);
        });
    };
    AuthService.prototype.logout = function () {
        this.u.storage.remove('token');
        this.authenticated = false;
    };
    AuthService.prototype.checkAuth = function () {
        var _this = this;
        return new Promise(function (res, rej) {
            var token = _this.getToken();
            _this.authenticated = !!token;
            return token ? _this.checkUser().then(res, rej) : rej();
        });
    };
    AuthService = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Injectable"])(),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1__angular_common_http__["b" /* HttpClient */],
            __WEBPACK_IMPORTED_MODULE_3__util_service__["a" /* UtilService */]])
    ], AuthService);
    return AuthService;
}());

// da usare per le rotte sotto autenticazione
var CanActivateAuth = /** @class */ (function () {
    function CanActivateAuth(auth) {
        this.auth = auth;
    }
    CanActivateAuth.prototype.canActivate = function (route, state) {
        return this.auth.authenticated;
    };
    CanActivateAuth = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Injectable"])(),
        __metadata("design:paramtypes", [AuthService])
    ], CanActivateAuth);
    return CanActivateAuth;
}());



/***/ }),

/***/ "./src/app/services/document.service.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return DocumentService; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__util_service__ = __webpack_require__("./src/app/services/util.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_lodash__ = __webpack_require__("./node_modules/lodash/lodash.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_lodash___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_lodash__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__auth_service__ = __webpack_require__("./src/app/services/auth.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__angular_common_http__ = __webpack_require__("./node_modules/@angular/common/esm5/http.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__angular_router__ = __webpack_require__("./node_modules/@angular/router/esm5/router.js");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};






var BASE_PATH = 'service';
var DEFAULT_DBO_SCRIPT = "=\n/**\n* you can define directly your db object.\n* sample:\n* {\n*   products: [{\n*     id: 1,\n*     name: 'product 1'\n*   }, {\n*     id: 2,\n*     name: 'product 2'\n*   }]\n* }\n*\n* otherwise you can use javascript code to define database object using \"=\" as the first charcter:\n*/\nconst db = {};\n/**\n* you can add properties to db object to use them in calls.\n* sample:\n* db.products = [];\n* for(let i=0;i<10;i++) {\n*   db.products.push({name:'product n\u00B0'+(i+1), id:i, ...})\n* }\n*/\nreturn db;";
var DocumentService = /** @class */ (function () {
    function DocumentService(u, auth, router, http) {
        this.u = u;
        this.auth = auth;
        this.router = router;
        this.http = http;
        this.current = null;
        this.idle = false;
        this.services = [];
    }
    DocumentService.prototype.load = function (id) {
        if (this.idle) {
            return;
        }
        this.idle = true;
        // todo
    };
    DocumentService.prototype.refreshUrls = function (call, service) {
        service = service || this.current;
        if (!call || !service) {
            return;
        }
        call._url = this.u.getUrl(BASE_PATH, service.path || 'undefined', call.path || 'undefined');
        call._url1 = this.u.getUrl(BASE_PATH) + '/';
        call._url2 = this.u.checkUrl(service.path || 'undefined', call.path || 'undefined');
    };
    DocumentService.prototype.getSerialization = function (o) {
        var so = __WEBPACK_IMPORTED_MODULE_2_lodash__["omit"](o, '_ser', '_original', '_modified', '_confirm');
        return JSON.stringify(so);
    };
    DocumentService.prototype.useSwagger = function (swg) {
        console.log('SWAGGER', swg);
        if (this.current) {
            // TODO: mergia le info del file swagger sul servizio corrente... 
        }
        else {
            // TODO: genera nuovo servizio da file swagger...
        }
    };
    DocumentService.prototype.loadSwagger = function (e) {
        var _this = this;
        var files = (e.dataTransfer || e.targete).files;
        if (files && files.length > 0) {
            var file = files[0];
            if (!/(.*).json/i.test(file.name)) {
                e.target.value = '';
                this.u.error('Swagger must be a json file!');
            }
            else {
                this.idle = true;
                var reader_1 = new FileReader();
                reader_1.onload = function () {
                    try {
                        var swg = JSON.parse(reader_1.result);
                        _this.idle = false;
                        _this.useSwagger(swg);
                    }
                    catch (err) {
                        _this.idle = false;
                        _this.u.error(err);
                    }
                };
                reader_1.onerror = function (err) {
                    _this.idle = false;
                    _this.u.error(err);
                };
                reader_1.readAsText(file);
            }
        }
    };
    DocumentService.prototype.doHttp = function (path, method, data) {
        if (method === void 0) { method = 'get'; }
        var url = this.auth.getUrl(path);
        return this.http[method](url, data);
    };
    DocumentService.prototype.reset = function () {
        this.services = [];
        this.current = null;
    };
    DocumentService.prototype.logout = function () {
        this.reset();
        this.auth.logout();
        this.router.navigate(['login']);
    };
    DocumentService.prototype.refreshList = function (force, cb) {
        var _this = this;
        if (force === void 0) { force = false; }
        if (force || !(this.services || []).length) {
            this.doHttp('services', 'get').subscribe(function (resp) {
                _this.services = resp;
                if (cb) {
                    cb();
                }
            }, this.u.error);
        }
        else if (cb) {
            cb();
        }
    };
    DocumentService.prototype.checkDocChanges = function () {
        var _this = this;
        setTimeout(function () {
            _this.current._ser = _this.getSerialization(_this.current);
            _this.current._modified = _this.current._ser !== _this.current._original;
        });
    };
    DocumentService.prototype.createService = function () {
        var _this = this;
        return new Promise(function (res, rej) {
            _this.doHttp('services', 'post', { name: _this.u.getNewName(_this.services, 'new virtual-service'), dbo: DEFAULT_DBO_SCRIPT })
                .subscribe(function (resp) {
                _this.refreshList(resp._id, function () {
                    _this.current = __WEBPACK_IMPORTED_MODULE_2_lodash__["find"](_this.services, function (s) { return s._id === resp._id; });
                    res();
                });
            }, function (err) {
                _this.u.error(err);
                rej();
            });
        });
    };
    DocumentService.prototype.initService = function (srv, full) {
        var _this = this;
        if (full === void 0) { full = false; }
        if (!srv) {
            return;
        }
        srv.calls = srv.calls || [];
        srv.calls.forEach(function (c) { return _this.refreshUrls(c); });
        if (!!srv._original && !full) {
            return;
        }
        srv._original = this.getSerialization(srv);
        srv._modified = false;
    };
    DocumentService.prototype.setCurrent = function (srv, route) {
        if (route === void 0) { route = ''; }
        this.current = srv;
        this.initService(this.current);
        if (route) {
            this.router.navigate([route]);
        }
    };
    DocumentService.prototype.createCall = function () {
        if (!this.current) {
            return;
        }
        var path = this.u.getNewName(this.current.calls, 'new-call', 'path');
        var call = {
            verb: 'get',
            path: path,
            respType: 'object',
            rules: [],
            values: [],
            response: '{}',
            testData: ''
        };
        this.current.calls.push(call);
        this.refreshUrls(call);
        this.checkDocChanges();
        return call;
    };
    DocumentService.prototype.save = function () {
        var _this = this;
        if (!this.current) {
            return;
        }
        this.doHttp('services', 'post', this.current)
            .subscribe(function () { return _this.initService(_this.current, true); }, this.u.error);
    };
    DocumentService.prototype.deleteService = function (srv) {
        var _this = this;
        this.doHttp('services/' + srv._id, 'delete').subscribe(function () { return _this.refreshList(true); }, this.u.error);
    };
    DocumentService.prototype.deleteCall = function (call) {
        __WEBPACK_IMPORTED_MODULE_2_lodash__["pull"](this.current.calls, call);
        this.checkDocChanges();
    };
    DocumentService.prototype.checkChanges = function () {
        // se è modificato chiede se salvare
        return Promise.resolve();
    };
    DocumentService.prototype.getLog = function (last) {
        if (!this.current) {
            return [];
        }
        var url = 'services/monitor/' + this.current._id + '/' + (last || 0);
        return this.doHttp(url).toPromise();
    };
    DocumentService = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Injectable"])(),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1__util_service__["a" /* UtilService */],
            __WEBPACK_IMPORTED_MODULE_3__auth_service__["a" /* AuthService */],
            __WEBPACK_IMPORTED_MODULE_5__angular_router__["c" /* Router */],
            __WEBPACK_IMPORTED_MODULE_4__angular_common_http__["b" /* HttpClient */]])
    ], DocumentService);
    return DocumentService;
}());



/***/ }),

/***/ "./src/app/services/interaction.service.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return InteractionService; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};

var InteractionService = /** @class */ (function () {
    function InteractionService() {
    }
    InteractionService = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Injectable"])(),
        __metadata("design:paramtypes", [])
    ], InteractionService);
    return InteractionService;
}());



/***/ }),

/***/ "./src/app/services/interceptor.service.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return InterceptorService; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__auth_service__ = __webpack_require__("./src/app/services/auth.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var InterceptorService = /** @class */ (function () {
    function InterceptorService(auth) {
        this.auth = auth;
    }
    InterceptorService.prototype.intercept = function (request, next) {
        request = request.clone({
            setHeaders: {
                Authorization: this.auth.getAuthorizationHeader()
            }
        });
        return next.handle(request);
    };
    InterceptorService = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Injectable"])(),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1__auth_service__["a" /* AuthService */]])
    ], InterceptorService);
    return InterceptorService;
}());



/***/ }),

/***/ "./src/app/services/toolbar.service.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ToolbarService; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};

var EmptyToolbar = /** @class */ (function () {
    function EmptyToolbar() {
        this.buttons = [];
        this.getTitle = function () { return ''; };
    }
    return EmptyToolbar;
}());
var ToolbarService = /** @class */ (function () {
    function ToolbarService() {
        this.emptyBar = new EmptyToolbar();
        this.current = this.emptyBar;
    }
    ToolbarService.prototype.register = function (bar) {
        this.current = bar || this.emptyBar;
    };
    ToolbarService.prototype.unregister = function () {
        this.current = this.emptyBar;
    };
    ToolbarService = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Injectable"])(),
        __metadata("design:paramtypes", [])
    ], ToolbarService);
    return ToolbarService;
}());



/***/ }),

/***/ "./src/app/services/util.service.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return UtilService; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_angular_webstorage_service__ = __webpack_require__("./node_modules/angular-webstorage-service/bundles/angular-webstorage-service.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_lodash__ = __webpack_require__("./node_modules/lodash/lodash.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_lodash___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_lodash__);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};



var UtilService = /** @class */ (function () {
    function UtilService(local_storage) {
        var _this = this;
        this.local_storage = local_storage;
        this.storage = null;
        this.app = {
            name: 'Virtual Service',
            version: '0.0.1'
        };
        this.err = null;
        this.idle = {
            active: false,
            message: '',
            start: function (message) {
                if (message === void 0) { message = null; }
                _this.idle.message = message || '';
                setTimeout(function () { return _this.idle.active = true; });
            },
            stop: function () { return setTimeout(function () { return _this.idle.active = false; }); },
            update: function (message) { return _this.idle.message = message; }
        };
        this.dialogData = {
            options: null,
            component: null,
            data: null,
            ok: 'ok',
            cancel: 'cancel',
            valid: true,
            callback: function () { },
            reset: function () {
                _this.dialogData.ok = 'ok';
                _this.dialogData.cancel = 'cancel';
                _this.dialogData.valid = true;
                _this.dialogData.component = null;
                _this.dialogData.data = null;
                _this.dialogData.callback = function () { };
            }
        };
        this.storage = local_storage;
    }
    UtilService_1 = UtilService;
    UtilService.isText = function (txt) {
        return !__WEBPACK_IMPORTED_MODULE_2_lodash__["startsWith"]((txt || '').trim(), '<');
    };
    UtilService.getErrorMessage = function (err, def) {
        def = def || 'Generic error!';
        if (__WEBPACK_IMPORTED_MODULE_2_lodash__["isString"](err)) {
            return err;
        }
        if (__WEBPACK_IMPORTED_MODULE_2_lodash__["isObject"](err)) {
            if (err.error && __WEBPACK_IMPORTED_MODULE_2_lodash__["isString"](err.error) && UtilService_1.isText(err.error)) {
                return err.error;
            }
            if (__WEBPACK_IMPORTED_MODULE_2_lodash__["isObject"](err.error) && __WEBPACK_IMPORTED_MODULE_2_lodash__["isString"](err.error.message))
                return err.error.message;
            if (__WEBPACK_IMPORTED_MODULE_2_lodash__["isString"](err.message)) {
                return err.message;
            }
            if (err.data && __WEBPACK_IMPORTED_MODULE_2_lodash__["isString"](err.data)) {
                return err.data;
            }
            if (__WEBPACK_IMPORTED_MODULE_2_lodash__["isObject"](err.data)) {
                return JSON.stringify(err.data);
            }
            if (err && err.status < 0 && __WEBPACK_IMPORTED_MODULE_2_lodash__["isObject"](err.config)) {
                return '"' + err.config.method + '" on "' + err.config.url + '" has caused an error';
            }
            if (err.statusText) {
                return err.status ? err.status + ' - ' + err.statusText : err.statusText;
            }
        }
        return def;
    };
    UtilService.prototype.copyToClipboard = function (txt) {
        var box = document.createElement('textarea');
        box.style.position = 'fixed';
        box.style.left = '0';
        box.style.top = '0';
        box.style.opacity = '0';
        box.value = txt;
        document.body.appendChild(box);
        box.focus();
        box.select();
        document.execCommand('copy');
        document.body.removeChild(box);
    };
    UtilService.prototype.getNewName = function (list, template, fieldName) {
        fieldName = fieldName || 'name';
        var n = template || 'new element';
        if (__WEBPACK_IMPORTED_MODULE_2_lodash__["isArray"](list)) {
            var index = 0;
            while (!!__WEBPACK_IMPORTED_MODULE_2_lodash__["find"](list, function (i) { return i[fieldName] === n; })) {
                n = template + '(' + (++index) + ')';
            }
        }
        return n;
    };
    UtilService.prototype.error = function (err) {
        this.err = err ? UtilService_1.getErrorMessage(err) : null;
        if (err)
            console.error(err);
    };
    UtilService.prototype.checkUrl = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var url = [];
        (args || []).forEach(function (part) {
            part = part || '';
            part = part.replace(/:\/\//, '{VS-PDL}');
            part.split(/\//).forEach(function (p) {
                if (p === '..') {
                    url.pop();
                }
                else if (p) {
                    url.push(p.replace(/{VS-PDL}/, '://'));
                }
            });
        });
        return url.join('/');
    };
    UtilService.prototype.getUrl = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        args.unshift(location.origin);
        return this.checkUrl.apply(null, args);
    };
    UtilService.prototype._enc = function (v) {
        return (v + '');
    };
    UtilService.prototype.getUrlParams = function (o) {
        var self = this;
        var params_cll = [];
        if (o) {
            __WEBPACK_IMPORTED_MODULE_2_lodash__["keys"](o).forEach(function (pn) { return params_cll.push(self._enc(pn) + '=' + self._enc(o[pn])); });
        }
        return params_cll.length ? '?' + params_cll.join('&') : '';
    };
    UtilService.prototype.dialog = function (component, data, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        return new Promise(function (res, rej) {
            _this.dialogData.data = data;
            _this.dialogData.options = options;
            _this.dialogData.callback = function (resp) { return resp ? res(resp) : rej(); };
            _this.dialogData.component = component;
        });
    };
    UtilService.prototype.closeDialog = function () {
        this.dialogData.reset();
    };
    UtilService.prototype.format = function (str, o) {
        if (o === void 0) { o = {}; }
        str = str || '';
        __WEBPACK_IMPORTED_MODULE_2_lodash__["keys"](o).forEach(function (pn) {
            var rgx = new RegExp('{' + pn + '}', 'g');
            str = str.replace(rgx, o[pn] || '');
        });
        return str;
    };
    UtilService.prototype.parseJS = function (txt) {
        var f = new Function('return ' + txt);
        try {
            return f();
        }
        catch (err) {
            console.error(err);
        }
    };
    UtilService.prototype.notify = function (message) {
        // TODO....
        // mostra messaggio con possibilità di riposta (si no cancel)
        console.log(message);
        return Promise.resolve();
    };
    UtilService = UtilService_1 = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Injectable"])(),
        __param(0, Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Inject"])(__WEBPACK_IMPORTED_MODULE_1_angular_webstorage_service__["a" /* LOCAL_STORAGE */])),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1_angular_webstorage_service__["c" /* WebStorageService */]])
    ], UtilService);
    return UtilService;
    var UtilService_1;
}());



/***/ }),

/***/ "./src/environments/environment.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return environment; });
// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.
var environment = {
    production: false,
    origin: 'http://localhost:9010/'
};


/***/ }),

/***/ "./src/main.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_platform_browser_dynamic__ = __webpack_require__("./node_modules/@angular/platform-browser-dynamic/esm5/platform-browser-dynamic.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__app_app_module__ = __webpack_require__("./src/app/app.module.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__environments_environment__ = __webpack_require__("./src/environments/environment.ts");




if (__WEBPACK_IMPORTED_MODULE_3__environments_environment__["a" /* environment */].production) {
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["enableProdMode"])();
}
Object(__WEBPACK_IMPORTED_MODULE_1__angular_platform_browser_dynamic__["a" /* platformBrowserDynamic */])().bootstrapModule(__WEBPACK_IMPORTED_MODULE_2__app_app_module__["a" /* AppModule */])
    .catch(function (err) { return console.log(err); });


/***/ }),

/***/ 0:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__("./src/main.ts");


/***/ })

},[0]);
//# sourceMappingURL=main.bundle.js.map