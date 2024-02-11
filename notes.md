# REVISITING:

- main menu styling

# ISSUES:

- when I filter by tag and try to view the contact card it doesn't load the modal menu
- when I filter by search and try to view the contact card it doesn't load the modal menu
- contact card "update" button losing its "click" event handler, when is the listener registered?

# WORKING ON -> putting UPDATE contact inside modal <- WORKING ON

-

# QUEUED:

- contact cards MODAL

  - clickable contact cards, update and delete buttons aren't visible on the `contacts-view`
  - open a modal, here we update/edit the contact and RENDER selected `tags`

- add error handling for invalid http requests or failed requests or "wrong" inputs
- input validation with the validation api
- setup - reconcile the RENDER and setup functions - register partials separately at the beginning

# DONE:

- modal delete button deletes contact and returns to previous view
- multi-select filtration of the contacts array (contacts-view)
- add tag not rendering default view
- tags-view above contacts-view
- filter contacts functionality based on selected
- setup handlers for rendered html's actions
- click on tag change color add .select class
- when I return to the main page, the previously-rendered `tags-view` content was hidden
- fix the "update contact" template's tag multiselect
- getting the "create Contact view to render"
- refactor naming and organization of source html and handlebars templates
