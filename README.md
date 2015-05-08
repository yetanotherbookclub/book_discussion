# book_discussion
Sample microservice for Building Microservices Book Club

Examples of supported calls:

* curl -H "Accept: application/json" --url http://localhost:5000/discussions
* curl -H "Accept: application/json" --url http://localhost:5000/discussions/1
* curl -H "Accept: application/json" --url http://localhost:5000/discussions/1/responses/1
* curl -d "{\"author_id\":\"3\",\"comment\":\"a test comment\"}" --header "Content-Type: application/json" -H "Accept: application/json" --url http://localhost:5000/discussions/1/responses
* curl -d "{\"author_id\":\"3\",\"comment\":\"another test comment\"}" --header "Content-Type: application/json" -H "Accept: application/json" --url http://localhost:5000/discussions/1/responses/4/responses
* curl -d "{\"author_id\":\"4\",\"book_id\":\"12345\",\"title\":\"New discussion about 12345\",\"subject\":\"How does the author use botanical imagery to evoke class struggle?  What do you think the poppy represents?\"}" --header "Content-Type: application/json" -H "Accept: application/json" --url http://localhost:5000/discussions
