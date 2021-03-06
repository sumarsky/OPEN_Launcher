describe("Login page", () => {

  var LogInPage = require("./pages/LoginPageObject.js");

  var loginUrl = "http://localhost:3000/#/login";
  var deletingCanceledMessage = "Бришењето е откажано.";
  var enAppName = "OPEN";

  beforeEach(() => {
    browser.get(loginUrl);
    browser.sleep(1000);
    browser.ignoreSynchronization = true;
  });

  it("should change the language to English", () => {
    LogInPage.chooseEnglishLanguage();
    expect(LogInPage.getAppName()).toEqual(enAppName);
  });

  it("should not display the log in button when profile is not selected", () => {
    expect(LogInPage.isLoginBtnVisible()).toBeFalsy();
  });

  it("should log out user", () => {
    LogInPage.logIn();
    LogInPage.logOut();
    expect(browser.getCurrentUrl()).toEqual(loginUrl);
  });

  it("should filter profiles by username", () => {
    LogInPage.filterUsername();
    expect(LogInPage.getFirstFilteredUsername()).toContain("Aleksandra");
    LogInPage.clearFilterUsernameField();
  });

  it("should cancel profile deleting", () => {
    LogInPage.cancelDelete();
    expect(LogInPage.returnAlertMessage()).toEqual(deletingCanceledMessage);
    browser.sleep(1000);
    browser.ignoreSynchronization = false;
  });

  it("should not display a delete button when profile is not selected", () => {
    expect(LogInPage.isDeleteBtnVisible()).toBeFalsy();
  });
});

