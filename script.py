# This script takes the template file and and injects index.html file into it


with open("temp.html", "r") as file:
	templete = file.read()


with open("index.html", "r") as file:
	content = file.read()


template_pattern = "<div class=\"container\">"
output_append_point = templete.find(template_pattern)

index_pattern_start = "<h2>"
index_pattern_end = "</body>"

input_append_start = content.find(index_pattern_start)
input_append_end = content.find(index_pattern_end)

output = templete[:output_append_point+len(template_pattern)]+"\n"+content[input_append_start:input_append_end]+templete[output_append_point+len(template_pattern):] 

with open("index.html", "w") as file:
	file.write(output)

print("Injected Bootstrap into index.html")