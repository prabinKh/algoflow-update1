from rest_framework import serializers

from eadmin.models import ChatMessage, ChatSession


class ChatMessageSerializer(serializers.ModelSerializer):
    timestamp = serializers.DateTimeField(read_only=True)
    type = serializers.CharField(source="msg_type", read_only=True)
    msg_type = serializers.CharField(required=False)

    def validate_sender(self, value):
        if value == "ai":
            return "assistant"
        if value == "human":
            return "admin"
        return value

    class Meta:
        model = ChatMessage
        fields = (
            "id",
            "session",
            "sender",
            "text",
            "type",
            "msg_type",
            "timestamp",
            "status",
            "metadata",
            "attachments",
        )
        extra_kwargs = {
            "msg_type": {"write_only": True},
        }


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    unreadAdminCount = serializers.IntegerField(source="unread_admin_count", read_only=True)
    unreadUserCount = serializers.IntegerField(source="unread_user_count", read_only=True)
    userId = serializers.CharField(source="user_id_str", read_only=True)
    # Use CharField (not EmailField) so 'Guest' or any string is accepted
    userEmail = serializers.CharField(source="user_email", read_only=True, allow_null=True, default='')
    userName = serializers.CharField(source="user_name", read_only=True)
    lastMessage = serializers.CharField(source="last_message", read_only=True)
    lastMessageTime = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = ChatSession
        fields = "__all__"
        extra_kwargs = {
            "user_email": {"required": False, "allow_null": True, "allow_blank": True},
            "user_id_str": {"required": False, "allow_blank": True, "default": ""},
            "user_name": {"required": False, "allow_blank": True, "default": "Guest"},
            "company": {"required": False},
        }

