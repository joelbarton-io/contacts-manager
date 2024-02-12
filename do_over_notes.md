# Initial Load

0. import necessary libaries/modules
1. (`M`) make initial request to the server
2. (`M`) initialize all local data structures with initial request response data
3. (`V`) register Handlebars partials
4. (`V`) compile initial view(s)
5. (`C`) add event listeners to initial views
6. apply any initial data to those views
   - check if initial data is valid
7. render the _prepared_ views to the page by appending to body

# User Interactions

## `Create Tag`

0. (`VIEW`) compile **#tag-view** html
1. `addEventListeners` to the **#tag-view** elements like **#submit** & **#discard** buttons

## `Create Contact`

0. (`V`) compile **#create-contact-view** html
1. (`C`) `addEventListeners` to **#create-contact-view**
