import {
  it,
  inject,
  describe,
  beforeEachProviders
} from 'angular2/testing';
import {HTTP_PROVIDERS} from 'angular2/http';
import {provide} from 'angular2/core';
import {BaseRequestOptions, Http, Response, ResponseOptions} from 'angular2/http';
import {MockBackend, MockConnection} from 'angular2/http/testing';
import {Observable} from 'rxjs/Rx';

import {UserValidationService} from './UserValidationService';
import {GlobalService} from './GlobalService';
import {User} from '../models/User';
import {PointerType, PointerSize, PointerColor, BackgroundColor} from '../enums/UserSettingsEnums';
import {ValidationResponse} from '../../shared/models/ValidationResponse';

describe('UserValidationServiceTests', () => {
  var instance: UserValidationService = null;

  function getValidUser() {
    var result = new User();
    result.name = 'testName';
    result.profileImg = 'someProfileImage';
    return result;
  }

  beforeEachProviders(() => [
    BaseRequestOptions,
    MockBackend,
    provide(Http, {
      useFactory: function(backend, defaultOptions) {
        return new Http(backend, defaultOptions);
      },
      deps: [MockBackend, BaseRequestOptions]
    }),
    GlobalService,
    UserValidationService
  ]);

  it('should have http', inject([UserValidationService], (instance) => {
    expect(!!instance.http).toEqual(true);
  }));

  it('isValid_givenDefaultProfilePicture_shouldReturnObservableOfValidationResponseWithInvalidUser',
    inject([UserValidationService], (instance) => {
      // Arrange
      let user: User = getValidUser();
      user.profileImg = './assets/images/avatars/default.jpg';
      spyOn(instance, 'isUserPictureSet').and.callFake(() => {
        return false;
      });
      spyOn(instance, 'getInvalidUserPictureValidationResponse').and.callFake(() => { });

      // Act
      var result = instance.isValid(user);

      // Assert
      expect(instance.getInvalidUserPictureValidationResponse).toHaveBeenCalled();
    }));

  it('isValid_givenInvalidUserData_shouldReturnValidationResponseForInvalidUserData',
    inject([UserValidationService], (instance) => {
      // Arrange
      let user: User = getValidUser();
      spyOn(instance, 'isUserPictureSet').and.callFake(() => {
        return true;
      });
      spyOn(instance, 'isValidUserData').and.callFake(() => {
        return false;
      });
      spyOn(instance, 'getInvalidUserDataValidationResponse').and.callFake(() => { });

      // Act
      var result = instance.isValid(user);

      // Assert
      expect(instance.getInvalidUserDataValidationResponse).toHaveBeenCalled();
    }));

  it('isValid_givenValidUserDataValidationResponse_shouldReturnValidationResponseForInvalidUserData',
    inject([UserValidationService], (instance) => {
      // Arrange
      let user: User = getValidUser();
      user.profileImg = './assets/images/avatars/devojce.jpg';
      spyOn(instance, 'isUserPictureSet').and.callFake(() => { return true; });
      spyOn(instance, 'isValidUserData').and.callFake(() => { return true; });
      spyOn(instance, 'getExistingUserValidationResponse').and.callFake(() => { });

      // Act
      var result = instance.isValid(user);

      // Assert
      expect(instance.getExistingUserValidationResponse).toHaveBeenCalled();
    }));

  it('isValidUserData_givenValidUserData_shouldBeTruthy',
    inject([UserValidationService], (instance) => {
      // Arrange
      var result: boolean;
      var localUser: User = new User();
      localUser.profileImg = 'somePath';
      localUser.name = 'someName';
      localUser.userSettings.backgroundColor = 1;
      localUser.userSettings.pointerColor = 1;
      localUser.userSettings.pointerSize = 0;
      localUser.userSettings.pointerType = 1;

      // Act
      result = instance.isValidUserData(localUser);

      // Assert
      expect(result).toBeTruthy();
    }));

  it('isValidUserData_givenInvalidUserData_shouldBeFalsy',
    inject([UserValidationService], (instance) => {
      // Arrange
      var result: boolean;
      var localUser: User = new User();
      localUser.name = 'someName';
      localUser.userSettings.backgroundColor = 1;
      localUser.userSettings.pointerColor = 1;
      localUser.userSettings.pointerSize = 0;
      localUser.userSettings.pointerType = 1;

      // Act
      result = instance.isValidUserData(localUser);

      // Assert
      expect(result).toBeFalsy();
    }));

  it('getInvalidUserPictureValidationResponse_givenInvalidValidationResponse_shouldReturnValidationResponseForInvalidUserData',
    inject([UserValidationService], (instance) => {
      // Arrange
      var response = new ValidationResponse(false, 'За да креирате профил, ве молам изберете слика.');
      var result: ValidationResponse;

      // Act
      instance.getInvalidUserPictureValidationResponse().subscribe(data => { result = data; });

      // Assert
      expect(result).toEqual(response);
    }));

  it('getInvalidUserDataValidationResponse_givenFunctionIsCalled_shouldReturnValidationResponseForInvalidUserData',
    inject([UserValidationService], (instance) => {
      // Arrange
      var response = new ValidationResponse(false, 'Не се сите полиња пополнети.');
      var result: ValidationResponse;
      // Act

      instance.getInvalidUserDataValidationResponse().subscribe(data => { result = data; });

      // Assert
      expect(result).toEqual(response);
    }));

  it('getExistingUserValidationResponse_givenValidUser_shouldReturnResponseForNotExistingUser',
    inject([UserValidationService, MockBackend], (instance, mockBackend) => {
      // Arrange
      var existingUser = false;
      var responseExpected = new ValidationResponse(!existingUser);
      mockBackend.connections.subscribe(
        (connection: MockConnection) => {
          connection.mockRespond(new Response(
            new ResponseOptions({
              body: JSON.stringify(existingUser)
            }
            )));
        });

      // Act
      instance.getExistingUserValidationResponse('username').subscribe(
        (data) => {
          // Assert
          expect(data).toEqual(responseExpected);
        });
    }));

  it('getExistingUserValidationResponse_givenInvalidUser_shouldReturnResponseForExistingUser',
    inject([UserValidationService, MockBackend], (instance, mockBackend) => {
      // Arrange
      var existingUser = true;
      var responseExpected = new ValidationResponse(!existingUser, 'Корисничкото име веќе постои, обидете се да се регистрирате со друго име.');
      mockBackend.connections.subscribe(
        (connection: MockConnection) => {
          connection.mockRespond(new Response(
            new ResponseOptions({
              body: JSON.stringify(existingUser)
            }
            )));
        });

      // Act
      instance.getExistingUserValidationResponse('username').subscribe(
        (data) => {
          // Assert
          expect(data).toEqual(responseExpected);
        });
    }));
});
