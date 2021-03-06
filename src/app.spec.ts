import {
  beforeEachProviders,
  it,
  inject
} from 'angular2/testing';
import {provide} from 'angular2/core';
import {Observable} from 'rxjs/Rx';
import {Router} from 'angular2/router';
import {BaseRequestOptions, Http, Response, ResponseOptions} from 'angular2/http';
import {MockBackend, MockConnection} from 'angular2/http/testing';

import {AuthService} from './app/shared/services/AuthService';

import {AuthServiceMock} from './app/shared/mocks/AuthServiceMock';
import {RouterMock} from './app/shared/mocks/RouterMock';
import {TRANSLATE_PROVIDERS, TranslateService} from 'ng2-translate/ng2-translate';

import {App} from './app.ts';

describe('appComponentTests', () => {
  beforeEachProviders(() => [
    provide(AuthService, { useClass: AuthServiceMock }),
    provide(Router, { useClass: RouterMock }),
    BaseRequestOptions,
    MockBackend,
    provide(Http, {
      useFactory: (backend, defaultOptions) => {
        return new Http(backend, defaultOptions);
      },
      deps: [MockBackend, BaseRequestOptions]
    }),
    TRANSLATE_PROVIDERS,
    TranslateService,
    App
  ]);

  it('isUserLogged_givenAvailableAuthService_shouldBeTruthy',
    inject([App], (instance) => {
      // Arrange
      spyOn(instance.authService, 'isLogged').and.callFake(() => { return true; });

      // Act
      let result = instance.isUserLogged();

      // Assert
      expect(result).toBeTruthy();
      expect(instance.authService.isLogged).toHaveBeenCalled();
    }));

  it('getLoggedUser_givenAvailableAuthService_shouldReturnLoggedUser',
    inject([App], (instance) => {
      // Arrange
      let loggedUser = 'dragica';
      spyOn(instance.authService, 'getLoggedUser').and.callFake(() => { return loggedUser; });

      // Act
      let result = instance.getLoggedUser();

      // Assert
      expect(result).toBe(loggedUser);
    }));

  it('logout_givenAvailableAuthService_shouldRedirectToLogin',
    inject([App], (instance) => {
      // Arrange
      spyOn(instance.authService, 'logout').and.callFake(() => { return Observable.of(true); });
      spyOn(instance.router, 'navigate').and.callFake(() => { });

      // Act
      instance.logout();

      // Assert
      expect(instance.router.navigate).toHaveBeenCalledWith(['/Login']);
    }));
});
